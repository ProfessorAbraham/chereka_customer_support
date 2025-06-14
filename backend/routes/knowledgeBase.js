const express = require('express');
const {
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
} = require('../controllers/knowledgeBaseController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// Public routes
router.get('/articles', getArticles);
router.get('/articles/:slug', getArticleBySlug);
router.get('/categories', getCategories);
router.get('/tags', getTags);
router.get('/search', 
  [
    query('q')
      .isLength({ min: 2 })
      .withMessage('Search query must be at least 2 characters')
  ],
  handleValidationErrors,
  searchArticles
);

// Article rating (public but with optional auth)
router.post('/articles/:id/rate',
  [
    param('id').isInt().withMessage('Invalid article ID'),
    body('isHelpful').isBoolean().withMessage('isHelpful must be a boolean'),
    body('feedback').optional().isString().isLength({ max: 500 }).withMessage('Feedback must be a string with max 500 characters')
  ],
  handleValidationErrors,
  optionalAuth,
  rateArticle
);

// Protected routes - Article management
router.post('/articles',
  protect,
  authorize('admin', 'agent'),
  [
    body('title')
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('content')
      .isLength({ min: 50 })
      .withMessage('Content must be at least 50 characters'),
    body('categoryId')
      .isInt()
      .withMessage('Valid category ID is required'),
    body('status')
      .optional()
      .isIn(['draft', 'published', 'archived'])
      .withMessage('Status must be draft, published, or archived'),
    body('featured')
      .optional()
      .isBoolean()
      .withMessage('Featured must be a boolean'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('Each tag must be between 2 and 50 characters')
  ],
  handleValidationErrors,
  createArticle
);

router.put('/articles/:id',
  protect,
  authorize('admin', 'agent'),
  [
    param('id').isInt().withMessage('Invalid article ID'),
    body('title')
      .optional()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('content')
      .optional()
      .isLength({ min: 50 })
      .withMessage('Content must be at least 50 characters'),
    body('categoryId')
      .optional()
      .isInt()
      .withMessage('Valid category ID is required'),
    body('status')
      .optional()
      .isIn(['draft', 'published', 'archived'])
      .withMessage('Status must be draft, published, or archived'),
    body('featured')
      .optional()
      .isBoolean()
      .withMessage('Featured must be a boolean'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
  ],
  handleValidationErrors,
  updateArticle
);

router.delete('/articles/:id',
  protect,
  authorize('admin'),
  [
    param('id').isInt().withMessage('Invalid article ID')
  ],
  handleValidationErrors,
  deleteArticle
);

// Protected routes - Category management
router.post('/categories',
  protect,
  authorize('admin'),
  [
    body('name')
      .isLength({ min: 2, max: 100 })
      .withMessage('Category name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('color')
      .optional()
      .matches(/^#[0-9A-F]{6}$/i)
      .withMessage('Color must be a valid hex color'),
    body('icon')
      .optional()
      .isString()
      .isLength({ min: 2, max: 50 })
      .withMessage('Icon must be between 2 and 50 characters'),
    body('sortOrder')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Sort order must be a non-negative integer')
  ],
  handleValidationErrors,
  createCategory
);

module.exports = router;

