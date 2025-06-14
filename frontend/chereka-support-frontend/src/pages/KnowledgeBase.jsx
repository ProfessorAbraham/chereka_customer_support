import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { knowledgeBaseAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Search,
  BookOpen,
  Star,
  Eye,
  Calendar,
  User,
  Tag,
  Folder,
  Plus,
  Filter,
  Loader2,
  ArrowRight,
  TrendingUp,
  Clock
} from 'lucide-react';

const KnowledgeBase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFeatured, setShowFeatured] = useState(false);

  // Fetch articles
  const { data: articlesData, isLoading: loadingArticles } = useQuery({
    queryKey: ['knowledge-base-articles', selectedCategory, selectedTag, sortBy, showFeatured],
    queryFn: () => knowledgeBaseAPI.getArticles({
      category: selectedCategory || undefined,
      tag: selectedTag || undefined,
      sort: sortBy,
      featured: showFeatured || undefined,
      limit: 12
    })
  });

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['knowledge-base-categories'],
    queryFn: knowledgeBaseAPI.getCategories
  });

  // Fetch tags
  const { data: tags, isLoading: loadingTags } = useQuery({
    queryKey: ['knowledge-base-tags'],
    queryFn: knowledgeBaseAPI.getTags
  });

  // Search articles
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['knowledge-base-search', searchQuery],
    queryFn: () => knowledgeBaseAPI.searchArticles({ q: searchQuery }),
    enabled: searchQuery.length >= 2
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      // Search is handled by the query above
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedTag('');
    setSortBy('newest');
    setShowFeatured(false);
    setSearchQuery('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'folder':
        return <Folder className="h-4 w-4" />;
      case 'book':
        return <BookOpen className="h-4 w-4" />;
      case 'star':
        return <Star className="h-4 w-4" />;
      default:
        return <Folder className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-gray-600">
            Find answers to common questions and learn how to use our platform
          </p>
        </div>
        
        {(user?.role === 'admin' || user?.role === 'agent') && (
          <Button onClick={() => navigate('/knowledge-base/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={searchQuery.length < 2}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchQuery.length >= 2 && searchResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Search Results</span>
              <Badge variant="outline">{searchResults.count} results</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.results.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or browse categories below.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.results.map((article) => (
                  <div key={article.id} className="border-b pb-4 last:border-b-0">
                    <Link
                      to={`/knowledge-base/articles/${article.slug}`}
                      className="block hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{article.title}</h3>
                          {article.excerpt && (
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">{article.excerpt}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Folder className="h-3 w-3" />
                              <span>{article.category?.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{article.viewCount} views</span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 ml-4" />
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters and Categories */}
      {!searchQuery && (
        <>
          {/* Filter Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(category.icon)}
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Tags</SelectItem>
                    {tags?.map((tag) => (
                      <SelectItem key={tag.id} value={tag.slug}>
                        <div className="flex items-center space-x-2">
                          <Tag className="h-3 w-3" />
                          <span>{tag.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {tag.articleCount}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                    <SelectItem value="views">Most Viewed</SelectItem>
                    <SelectItem value="helpful">Most Helpful</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={showFeatured ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFeatured(!showFeatured)}
                >
                  <Star className="mr-2 h-3 w-3" />
                  Featured
                </Button>

                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Categories Overview */}
          {!selectedCategory && !selectedTag && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loadingCategories ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  categories?.map((category) => (
                    <Card
                      key={category.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedCategory(category.slug)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            {getCategoryIcon(category.icon)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{category.name}</h3>
                            <p className="text-sm text-gray-500">
                              {category.articleCount} articles
                            </p>
                          </div>
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {category.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Articles Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedCategory || selectedTag ? 'Filtered Articles' : 'Recent Articles'}
              </h2>
              {articlesData?.pagination && (
                <div className="text-sm text-gray-500">
                  Showing {articlesData.articles.length} of {articlesData.pagination.totalItems} articles
                </div>
              )}
            </div>

            {loadingArticles ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : articlesData?.articles?.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                  <p className="text-gray-600 mb-4">
                    {selectedCategory || selectedTag
                      ? 'No articles match your current filters.'
                      : 'No articles have been published yet.'}
                  </p>
                  {selectedCategory || selectedTag ? (
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articlesData.articles.map((article) => (
                  <Card key={article.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div
                            className="p-1 rounded text-xs"
                            style={{ 
                              backgroundColor: `${article.category?.color}20`, 
                              color: article.category?.color 
                            }}
                          >
                            {getCategoryIcon(article.category?.icon)}
                          </div>
                          <span className="text-sm font-medium" style={{ color: article.category?.color }}>
                            {article.category?.name}
                          </span>
                        </div>
                        {article.featured && (
                          <Badge variant="default" className="text-xs">
                            <Star className="mr-1 h-3 w-3" />
                            Featured
                          </Badge>
                        )}
                      </div>

                      <Link to={`/knowledge-base/articles/${article.slug}`}>
                        <h3 className="font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                          {article.title}
                        </h3>
                      </Link>

                      {article.excerpt && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{article.viewCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{article.helpfulCount}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(article.publishedAt)}</span>
                        </div>
                      </div>

                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag.id}
                              variant="outline"
                              className="text-xs cursor-pointer"
                              onClick={() => setSelectedTag(tag.slug)}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {article.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{article.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default KnowledgeBase;

