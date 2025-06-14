const { Article, Category, Tag, ArticleTag, ArticleRating, User } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Helper function to generate slug
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// @desc    Get all published articles with filtering and search
// @route   GET /api/knowledge-base/articles
// @access  Public
const getArticles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      search,
      featured,
      sort = 'publishedAt'
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    let whereClause = {
      status: 'published'
    };

    if (category) {
      whereClause['$category.slug$'] = category;
    }

    if (featured === 'true') {
      whereClause.featured = true;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } },
        { excerpt: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Build include clause
    let includeClause = [
      {
        model: Category,
        as: 'category',
        attributes: ['id', 'name', 'slug', 'color', 'icon']
      },
      {
        model: Tag,
        as: 'tags',
        attributes: ['id', 'name', 'slug', 'color'],
        through: { attributes: [] }
      },
      {
        model: User,
        as: 'author',
        attributes: ['id', 'firstName', 'lastName']
      }
    ];

    // Add tag filter if specified
    if (tag) {
      includeClause[1].where = { slug: tag };
      includeClause[1].required = true;
    }

    // Build order clause
    let orderClause;
    switch (sort) {
      case 'title':
        orderClause = [['title', 'ASC']];
        break;
      case 'views':
        orderClause = [['viewCount', 'DESC']];
        break;
      case 'helpful':
        orderClause = [['helpfulCount', 'DESC']];
        break;
      case 'newest':
        orderClause = [['publishedAt', 'DESC']];
        break;
      case 'oldest':
        orderClause = [['publishedAt', 'ASC']];
        break;
      default:
        orderClause = [['publishedAt', 'DESC']];
    }

    const { count, rows: articles } = await Article.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      articles,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single article by slug
// @route   GET /api/knowledge-base/articles/:slug
// @access  Public
const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const article = await Article.findOne({
      where: { 
        slug,
        status: 'published'
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'color', 'icon']
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'slug', 'color'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Increment view count
    await article.increment('viewCount');

    // Get related articles
    const relatedArticles = await Article.findAll({
      where: {
        status: 'published',
        categoryId: article.categoryId,
        id: { [Op.ne]: article.id }
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'color']
        }
      ],
      order: [['viewCount', 'DESC']],
      limit: 3
    });

    res.json({
      article,
      relatedArticles
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create new article
// @route   POST /api/knowledge-base/articles
// @access  Private (Admin/Agent)
const createArticle = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      categoryId,
      status = 'draft',
      featured = false,
      tags = [],
      metaTitle,
      metaDescription
    } = req.body;

    // Generate slug
    const slug = generateSlug(title);

    // Check if slug already exists
    const existingArticle = await Article.findOne({ where: { slug } });
    if (existingArticle) {
      return res.status(400).json({ message: 'Article with this title already exists' });
    }

    // Create article
    const article = await Article.create({
      title,
      slug,
      content,
      excerpt,
      categoryId,
      authorId: req.user.id,
      status,
      featured,
      metaTitle,
      metaDescription,
      publishedAt: status === 'published' ? new Date() : null
    });

    // Handle tags
    if (tags.length > 0) {
      const tagInstances = await Promise.all(
        tags.map(async (tagName) => {
          const [tag] = await Tag.findOrCreate({
            where: { name: tagName },
            defaults: {
              name: tagName,
              slug: generateSlug(tagName)
            }
          });
          return tag;
        })
      );

      await article.setTags(tagInstances);
    }

    // Fetch the created article with associations
    const createdArticle = await Article.findByPk(article.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'color', 'icon']
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'slug', 'color'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json(createdArticle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update article
// @route   PUT /api/knowledge-base/articles/:id
// @access  Private (Admin/Agent)
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      categoryId,
      status,
      featured,
      tags = [],
      metaTitle,
      metaDescription
    } = req.body;

    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && article.authorId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Generate new slug if title changed
    let slug = article.slug;
    if (title && title !== article.title) {
      slug = generateSlug(title);
      
      // Check if new slug already exists
      const existingArticle = await Article.findOne({ 
        where: { 
          slug,
          id: { [Op.ne]: id }
        }
      });
      if (existingArticle) {
        return res.status(400).json({ message: 'Article with this title already exists' });
      }
    }

    // Update article
    await article.update({
      title: title || article.title,
      slug,
      content: content || article.content,
      excerpt: excerpt || article.excerpt,
      categoryId: categoryId || article.categoryId,
      status: status || article.status,
      featured: featured !== undefined ? featured : article.featured,
      metaTitle: metaTitle || article.metaTitle,
      metaDescription: metaDescription || article.metaDescription,
      publishedAt: status === 'published' && !article.publishedAt ? new Date() : article.publishedAt
    });

    // Handle tags
    if (tags.length >= 0) {
      const tagInstances = await Promise.all(
        tags.map(async (tagName) => {
          const [tag] = await Tag.findOrCreate({
            where: { name: tagName },
            defaults: {
              name: tagName,
              slug: generateSlug(tagName)
            }
          });
          return tag;
        })
      );

      await article.setTags(tagInstances);
    }

    // Fetch updated article with associations
    const updatedArticle = await Article.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'color', 'icon']
        },
        {
          model: Tag,
          as: 'tags',
          attributes: ['id', 'name', 'slug', 'color'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    res.json(updatedArticle);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete article
// @route   DELETE /api/knowledge-base/articles/:id
// @access  Private (Admin)
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    await article.destroy();
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Rate article (helpful/not helpful)
// @route   POST /api/knowledge-base/articles/:id/rate
// @access  Public
const rateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { isHelpful, feedback } = req.body;
    const userId = req.user?.id;
    const ipAddress = req.ip;

    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check if user/IP already rated this article
    const existingRating = await ArticleRating.findOne({
      where: {
        articleId: id,
        [Op.or]: [
          userId ? { userId } : {},
          { ipAddress }
        ]
      }
    });

    if (existingRating) {
      return res.status(400).json({ message: 'You have already rated this article' });
    }

    // Create rating
    await ArticleRating.create({
      articleId: id,
      userId,
      isHelpful,
      feedback,
      ipAddress
    });

    // Update article counters
    if (isHelpful) {
      await article.increment('helpfulCount');
    } else {
      await article.increment('notHelpfulCount');
    }

    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all categories
// @route   GET /api/knowledge-base/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      include: [
        {
          model: Article,
          as: 'articles',
          where: { status: 'published' },
          attributes: ['id'],
          required: false
        }
      ],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });

    // Add article count to each category
    const categoriesWithCount = categories.map(category => ({
      ...category.toJSON(),
      articleCount: category.articles.length
    }));

    res.json(categoriesWithCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create category
// @route   POST /api/knowledge-base/categories
// @access  Private (Admin)
const createCategory = async (req, res) => {
  try {
    const { name, description, color, icon, sortOrder } = req.body;

    const slug = generateSlug(name);

    // Check if category already exists
    const existingCategory = await Category.findOne({ where: { slug } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      name,
      slug,
      description,
      color,
      icon,
      sortOrder
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get popular tags
// @route   GET /api/knowledge-base/tags
// @access  Public
const getTags = async (req, res) => {
  try {
    const tags = await Tag.findAll({
      include: [
        {
          model: Article,
          as: 'articles',
          where: { status: 'published' },
          attributes: ['id'],
          through: { attributes: [] },
          required: false
        }
      ]
    });

    // Add article count and sort by popularity
    const tagsWithCount = tags
      .map(tag => ({
        ...tag.toJSON(),
        articleCount: tag.articles.length
      }))
      .filter(tag => tag.articleCount > 0)
      .sort((a, b) => b.articleCount - a.articleCount)
      .slice(0, 20); // Top 20 tags

    res.json(tagsWithCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Search articles
// @route   GET /api/knowledge-base/search
// @access  Public
const searchArticles = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const searchTerm = q.trim();

    const articles = await Article.findAll({
      where: {
        status: 'published',
        [Op.or]: [
          { title: { [Op.iLike]: `%${searchTerm}%` } },
          { content: { [Op.iLike]: `%${searchTerm}%` } },
          { excerpt: { [Op.iLike]: `%${searchTerm}%` } }
        ]
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'color']
        }
      ],
      order: [
        // Prioritize title matches
        [Sequelize.literal(`CASE WHEN title ILIKE '%${searchTerm}%' THEN 1 ELSE 2 END`), 'ASC'],
        ['viewCount', 'DESC']
      ],
      limit: parseInt(limit)
    });

    res.json({
      query: searchTerm,
      results: articles,
      count: articles.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getArticles,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  rateArticle,
  getCategories,
  createCategory,
  getTags,
  searchArticles
};

