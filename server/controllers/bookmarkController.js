const User = require('../models/User');

exports.getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('bookmarks');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(user.bookmarks || []);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.addBookmark = async (req, res) => {
  try {
    const { osmId, name, amenity, cuisine, lat, lon } = req.body;

    if (!osmId || !name || typeof lat !== 'number' || typeof lon !== 'number') {
      return res.status(400).json({ error: 'osmId, name, lat, lon are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $addToSet: {
          bookmarks: {
            osmId: String(osmId),
            name,
            amenity: amenity || null,
            cuisine: cuisine || null,
            lat,
            lon,
            savedAt: new Date(),
          },
        },
      },
      { new: true }
    ).select('bookmarks');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user.bookmarks || []);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.removeBookmark = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $pull: { bookmarks: { osmId: String(req.params.osmId) } } },
      { new: true }
    ).select('bookmarks');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user.bookmarks || []);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
