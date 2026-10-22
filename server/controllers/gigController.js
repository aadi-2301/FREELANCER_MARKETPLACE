import { queryAll, queryGet, queryRun } from '../database/db.js';
import { logSecurityEvent } from '../middleware/auditLogger.js';

export const getAllGigs = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort } = req.query;

    let sql = `
      SELECT g.*, u.username as seller_username, u.full_name as seller_name, u.avatar as seller_avatar, u.rating as seller_rating
      FROM gigs g
      JOIN users u ON g.freelancer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'All') {
      sql += ' AND g.category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (g.title LIKE ? OR g.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      sql += ' AND g.tier_basic_price >= ?';
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      sql += ' AND g.tier_basic_price <= ?';
      params.push(Number(maxPrice));
    }

    if (sort === 'price_asc') {
      sql += ' ORDER BY g.tier_basic_price ASC';
    } else if (sort === 'price_desc') {
      sql += ' ORDER BY g.tier_basic_price DESC';
    } else {
      sql += ' ORDER BY g.id DESC';
    }

    const gigs = await queryAll(sql, params);

    // Parse JSON features for each gig
    const formatted = gigs.map(gig => ({
      ...gig,
      tier_basic_features: JSON.parse(gig.tier_basic_features || '[]'),
      tier_standard_features: JSON.parse(gig.tier_standard_features || '[]'),
      tier_premium_features: JSON.parse(gig.tier_premium_features || '[]')
    }));

    res.json({ gigs: formatted });
  } catch (err) {
    console.error('Error fetching gigs:', err);
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export const getGigById = async (req, res) => {
  try {
    const { id } = req.params;
    const gig = await queryGet(`
      SELECT g.*, u.username as seller_username, u.full_name as seller_name, u.avatar as seller_avatar, u.bio as seller_bio, u.rating as seller_rating, u.reviews_count as seller_reviews
      FROM gigs g
      JOIN users u ON g.freelancer_id = u.id
      WHERE g.id = ?
    `, [id]);

    if (!gig) {
      return res.status(404).json({ error: 'Not Found', message: 'Gig not found.' });
    }

    const reviews = await queryAll(`
      SELECT r.*, u.username as reviewer_username, u.avatar as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.client_id = u.id
      WHERE r.gig_id = ?
      ORDER BY r.id DESC
    `, [id]);

    res.json({
      gig: {
        ...gig,
        tier_basic_features: JSON.parse(gig.tier_basic_features || '[]'),
        tier_standard_features: JSON.parse(gig.tier_standard_features || '[]'),
        tier_premium_features: JSON.parse(gig.tier_premium_features || '[]')
      },
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};

export const createGig = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      cover_image,
      tier_basic_title,
      tier_basic_price,
      tier_basic_days,
      tier_basic_features,
      tier_standard_title,
      tier_standard_price,
      tier_standard_days,
      tier_standard_features,
      tier_premium_title,
      tier_premium_price,
      tier_premium_days,
      tier_premium_features,
      security_rating
    } = req.body;

    if (!title || !category || !tier_basic_price) {
      return res.status(400).json({ error: 'Validation Error', message: 'Required gig details missing.' });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    const defaultCover = cover_image || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80';

    const result = await queryRun(`
      INSERT INTO gigs (
        freelancer_id, title, slug, category, description, cover_image,
        tier_basic_title, tier_basic_price, tier_basic_days, tier_basic_features,
        tier_standard_title, tier_standard_price, tier_standard_days, tier_standard_features,
        tier_premium_title, tier_premium_price, tier_premium_days, tier_premium_features,
        security_rating, is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      req.user.id,
      title,
      slug,
      category,
      description || '',
      defaultCover,
      tier_basic_title || 'Basic Service',
      Number(tier_basic_price),
      Number(tier_basic_days || 3),
      JSON.stringify(tier_basic_features || ['Standard Delivery', 'Source Code / Report']),
      tier_standard_title || 'Standard Service',
      Number(tier_standard_price || Number(tier_basic_price) * 1.8),
      Number(tier_standard_days || 5),
      JSON.stringify(tier_standard_features || ['Standard Delivery', 'Full Source', 'Detailed Documentation']),
      tier_premium_title || 'Premium Enterprise Service',
      Number(tier_premium_price || Number(tier_basic_price) * 3),
      Number(tier_premium_days || 7),
      JSON.stringify(tier_premium_features || ['Priority Turnaround', 'Full Audit', 'Retesting & Warranty']),
      security_rating || 'A+'
    ]);

    await logSecurityEvent({
      event_type: 'GIG_PUBLISHED',
      severity: 'INFO',
      user_id: req.user.id,
      ip_address: req.ip || '127.0.0.1',
      user_agent: req.headers['user-agent'] || 'Unknown',
      details: `New Gig created ID ${result.lastID}: '${title}' by user '${req.user.username}'`
    });

    res.status(201).json({
      message: 'Gig published successfully',
      gigId: result.lastID,
      slug
    });
  } catch (err) {
    res.status(500).json({ error: 'Server Error', message: err.message });
  }
};
