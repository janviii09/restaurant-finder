const Bookmark = require('../models/Bookmark');
const User = require('../models/User');

// ═══════════════════════════════════════════════════════════════════
//  BOOKMARKS (embedded OSM data)
// ═══════════════════════════════════════════════════════════════════

exports.getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ status: 200, count: bookmarks.length, bookmarks });
  } catch (err) { next(err); }
};

exports.addBookmark = async (req, res, next) => {
  try {
    const { osm_id, name, lat, lon, cuisine, notes } = req.body;
    const bookmark = await Bookmark.create({
      user: req.user.userId,
      osm_id,
      name,
      lat,
      lon,
      cuisine: cuisine || '',
      notes: notes || '',
    });
    res.status(201).json({ status: 201, message: 'Bookmarked.', bookmark });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ status: 409, error: 'Already bookmarked.' });
    }
    next(err);
  }
};

exports.removeBookmark = async (req, res, next) => {
  try {
    const result = await Bookmark.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });
    if (!result) return res.status(404).json({ status: 404, error: 'Bookmark not found.' });
    res.json({ status: 200, message: 'Bookmark removed.' });
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════
//  EXPORT BOOKMARKS TO CSV
// ═══════════════════════════════════════════════════════════════════

exports.exportBookmarksCSV = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    const header = 'Name,Cuisine,Latitude,Longitude,OSM ID,Notes,Bookmarked At';
    const rows = bookmarks.map((b) => {
      return [
        `"${(b.name || '').replace(/"/g, '""')}"`,
        `"${(b.cuisine || '').replace(/"/g, '""')}"`,
        b.lat || '',
        b.lon || '',
        `"${b.osm_id || ''}"`,
        `"${(b.notes || '').replace(/"/g, '""')}"`,
        b.createdAt ? new Date(b.createdAt).toISOString() : '',
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bookmarks.csv"');
    res.send(csv);
  } catch (err) { next(err); }
};

// ═══════════════════════════════════════════════════════════════════
//  UPDATE PROFILE
// ═══════════════════════════════════════════════════════════════════

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, college } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (college) updates.college = college;

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true, runValidators: true });
    res.json({ status: 200, user: user.toJSON() });
  } catch (err) { next(err); }
};
