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
    const { geoapifyId, name, amenity, cuisine, lat, lon } = req.body;

    if (!geoapifyId || !name) {
      return res.status(400).json({ error: true, message: 'geoapifyId and name are required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        $addToSet: {
          bookmarks: {
            geoapifyId: String(geoapifyId),
            name,
            amenity: amenity || null,
            cuisine: cuisine || null,
            lat: typeof lat === 'number' ? lat : undefined,
            lon: typeof lon === 'number' ? lon : undefined,
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
      { $pull: { bookmarks: { geoapifyId: String(req.params.geoapifyId) } } },
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
