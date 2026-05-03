const Restaurant = require('../models/Restaurant');
const { reverseGeocode } = require('../services/nominatimService');
const { cloudinary } = require('../middleware/upload');

// ═══════════════════════════════════════════════════════════════════
//  GET /api/restaurants — Nearby restaurants (geospatial query)
// ═══════════════════════════════════════════════════════════════════
exports.getNearby = async (req, res, next) => {
  try {
    const {
      lat,
      lng,
      radius = 2000,
      cuisine,
      maxCost,
      pureVeg,
      hasDelivery,
      hasSeating,
      sortBy = 'distance',
      sortOrder = 'asc',
      q,
      page = 1,
      limit = 50,
    } = req.query;

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusMeters = parseInt(radius, 10);
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // ─── Build filter object ──────────────────────────────────
    const filter = {
      status: 'approved',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusMeters,
        },
      },
    };

    // Text search (if query provided, use $text instead of $near)
    // MongoDB doesn't allow $text + $near in the same query,
    // so we switch to $geoWithin + $text for text searches.
    if (q && q.trim()) {
      delete filter.location;
      filter.$text = { $search: q };
      filter.location = {
        $geoWithin: {
          $centerSphere: [
            [longitude, latitude],
            radiusMeters / 6378100, // Convert meters to radians (Earth radius ≈ 6378.1 km)
          ],
        },
      };
    }

    // Facet filters
    if (cuisine) {
      const cuisineArr = cuisine.split(',').map((c) => c.trim()).filter(Boolean);
      if (cuisineArr.length > 0) {
        filter.cuisine = { $in: cuisineArr };
      }
    }

    if (maxCost) {
      filter.costForTwo = { $lte: parseInt(maxCost, 10) };
    }

    if (pureVeg === true || pureVeg === 'true') {
      filter.pureVeg = true;
    }

    if (hasDelivery === true || hasDelivery === 'true') {
      filter.hasDelivery = true;
    }

    if (hasSeating === true || hasSeating === 'true') {
      filter.hasSeating = true;
    }

    // ─── Build sort ───────────────────────────────────────────
    let sort = {};
    const order = sortOrder === 'desc' ? -1 : 1;

    switch (sortBy) {
      case 'rating':
        sort = { avgRating: -1 }; // Always highest first for rating
        break;
      case 'costForTwo':
        sort = { costForTwo: order };
        break;
      case 'distance':
      default:
        // $near already sorts by distance, no explicit sort needed
        // For $geoWithin (text search), we add textScore
        if (q && q.trim()) {
          sort = { score: { $meta: 'textScore' } };
        }
        break;
    }

    // ─── Execute query ────────────────────────────────────────
    const queryBuilder = Restaurant.find(filter)
      .select('-__v')
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Add textScore projection if text search
    if (q && q.trim()) {
      queryBuilder.select({ score: { $meta: 'textScore' } });
    }

    if (Object.keys(sort).length > 0) {
      queryBuilder.sort(sort);
    }

    const [restaurants, total] = await Promise.all([
      queryBuilder.lean(),
      Restaurant.countDocuments(filter),
    ]);

    res.json({
      status: 200,
      count: restaurants.length,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
      restaurants,
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  GET /api/restaurants/:slug — Single restaurant by slug
// ═══════════════════════════════════════════════════════════════════
exports.getBySlug = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      slug: req.params.slug,
      status: { $ne: 'soft-deleted' },
    })
      .populate('owner', 'name avatar')
      .lean();

    if (!restaurant) {
      return res.status(404).json({
        status: 404,
        error: 'Restaurant not found.',
      });
    }

    res.json({ status: 200, restaurant });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  POST /api/restaurants — Add a new restaurant
// ═══════════════════════════════════════════════════════════════════
exports.addRestaurant = async (req, res, next) => {
  try {
    const {
      name,
      description,
      latitude,
      longitude,
      address,
      cuisine,
      costForTwo,
      pureVeg,
      hasDelivery,
      hasSeating,
      hasTakeaway,
      phone,
      website,
      operatingHours,
    } = req.body;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // ─── Auto-fill address via Nominatim if not provided ──────
    let resolvedAddress = address || {};
    if (!resolvedAddress.street && !resolvedAddress.area) {
      try {
        const geo = await reverseGeocode(lat, lng);
        resolvedAddress = {
          street: geo.street,
          area: geo.area,
          city: geo.city,
          pincode: geo.pincode,
          ...resolvedAddress, // User-provided fields override
        };
      } catch (geoErr) {
        console.warn('Geocoding failed (continuing without address):', geoErr.message);
      }
    }

    // ─── Build restaurant document ────────────────────────────
    const restaurantData = {
      name,
      description: description || '',
      owner: req.user._id,
      location: {
        type: 'Point',
        coordinates: [lng, lat], // GeoJSON is [longitude, latitude]
      },
      address: resolvedAddress,
      cuisine: cuisine || [],
      costForTwo: costForTwo || 0,
      pureVeg: pureVeg || false,
      hasDelivery: hasDelivery || false,
      hasSeating: hasSeating || false,
      hasTakeaway: hasTakeaway !== false, // Default true
      phone: phone || '',
      website: website || '',
      operatingHours: operatingHours || [],
      images: req.processedImages || [],
      status: req.user.role === 'admin' ? 'approved' : 'pending',
    };

    // Auto-approve if admin is adding
    if (req.user.role === 'admin') {
      restaurantData.approvedBy = req.user._id;
      restaurantData.approvedAt = new Date();
    }

    const restaurant = await Restaurant.create(restaurantData);

    res.status(201).json({
      status: 201,
      message:
        restaurant.status === 'approved'
          ? 'Restaurant added and approved.'
          : 'Restaurant submitted for approval.',
      restaurant,
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  PUT /api/restaurants/:id — Edit a restaurant
// ═══════════════════════════════════════════════════════════════════
exports.updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        status: 404,
        error: 'Restaurant not found.',
      });
    }

    // Authorization: owner can edit their own, admin can edit any
    if (
      req.user.role !== 'admin' &&
      restaurant.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 403,
        error: 'You can only edit restaurants you own.',
      });
    }

    // ─── Update fields ────────────────────────────────────────
    const {
      name,
      description,
      latitude,
      longitude,
      address,
      cuisine,
      costForTwo,
      pureVeg,
      hasDelivery,
      hasSeating,
      hasTakeaway,
      phone,
      website,
      operatingHours,
    } = req.body;

    if (name !== undefined) restaurant.name = name;
    if (description !== undefined) restaurant.description = description;
    if (cuisine !== undefined) restaurant.cuisine = cuisine;
    if (costForTwo !== undefined) restaurant.costForTwo = costForTwo;
    if (pureVeg !== undefined) restaurant.pureVeg = pureVeg;
    if (hasDelivery !== undefined) restaurant.hasDelivery = hasDelivery;
    if (hasSeating !== undefined) restaurant.hasSeating = hasSeating;
    if (hasTakeaway !== undefined) restaurant.hasTakeaway = hasTakeaway;
    if (phone !== undefined) restaurant.phone = phone;
    if (website !== undefined) restaurant.website = website;
    if (operatingHours !== undefined) restaurant.operatingHours = operatingHours;

    // Update location if new coordinates provided
    if (latitude !== undefined && longitude !== undefined) {
      restaurant.location = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    // Merge address
    if (address) {
      restaurant.address = { ...restaurant.address.toObject?.() || restaurant.address, ...address };
    }

    // Append new images (don't replace existing)
    if (req.processedImages && req.processedImages.length > 0) {
      restaurant.images = [...restaurant.images, ...req.processedImages];
    }

    await restaurant.save();

    res.json({
      status: 200,
      message: 'Restaurant updated successfully.',
      restaurant,
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  PATCH /api/restaurants/:id/approve — Admin: approve a listing
// ═══════════════════════════════════════════════════════════════════
exports.approveRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ status: 404, error: 'Restaurant not found.' });
    }

    if (restaurant.status === 'approved') {
      return res.status(400).json({ status: 400, error: 'Restaurant is already approved.' });
    }

    restaurant.status = 'approved';
    restaurant.approvedBy = req.user._id;
    restaurant.approvedAt = new Date();
    await restaurant.save();

    res.json({
      status: 200,
      message: 'Restaurant approved.',
      restaurant,
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  PATCH /api/restaurants/:id/reject — Admin: reject a listing
// ═══════════════════════════════════════════════════════════════════
exports.rejectRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ status: 404, error: 'Restaurant not found.' });
    }

    restaurant.status = 'rejected';
    await restaurant.save();

    res.json({
      status: 200,
      message: 'Restaurant rejected.',
      restaurant,
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  DELETE /api/restaurants/:id — Soft-delete a restaurant
// ═══════════════════════════════════════════════════════════════════
exports.softDelete = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ status: 404, error: 'Restaurant not found.' });
    }

    // Authorization: owner or admin
    if (
      req.user.role !== 'admin' &&
      restaurant.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 403,
        error: 'You can only delete restaurants you own.',
      });
    }

    restaurant.status = 'soft-deleted';
    await restaurant.save();

    res.json({
      status: 200,
      message: 'Restaurant soft-deleted.',
    });
  } catch (err) {
    next(err);
  }
};

// ═══════════════════════════════════════════════════════════════════
//  DELETE /api/restaurants/:id/images/:imageIndex — Remove an image
// ═══════════════════════════════════════════════════════════════════
exports.removeImage = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ status: 404, error: 'Restaurant not found.' });
    }

    // Authorization
    if (
      req.user.role !== 'admin' &&
      restaurant.owner.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ status: 403, error: 'Not authorized.' });
    }

    const imageIndex = parseInt(req.params.imageIndex, 10);
    if (isNaN(imageIndex) || imageIndex < 0 || imageIndex >= restaurant.images.length) {
      return res.status(400).json({ status: 400, error: 'Invalid image index.' });
    }

    const image = restaurant.images[imageIndex];

    // Delete from Cloudinary
    if (image.publicId) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (cloudErr) {
        console.warn('Failed to delete from Cloudinary:', cloudErr.message);
      }
    }

    // Remove from array
    restaurant.images.splice(imageIndex, 1);
    await restaurant.save();

    res.json({
      status: 200,
      message: 'Image removed.',
      images: restaurant.images,
    });
  } catch (err) {
    next(err);
  }
};
