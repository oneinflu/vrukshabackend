const Pincode = require('../models/Pincode');

// Add a new serviceable pincode (Admin)
exports.addPincode = async (req, res) => {
  try {
    const { pincode, area, isServiceable } = req.body;

    if (!pincode || pincode.length !== 6) {
      return res.status(400).json({ message: 'Valid 6-digit pincode is required' });
    }

    const existing = await Pincode.findOne({ pincode });
    if (existing) {
      return res.status(400).json({ message: 'Pincode already exists' });
    }

    const newPincode = await Pincode.create({
      pincode,
      area,
      isServiceable: isServiceable !== undefined ? isServiceable : true
    });

    res.status(201).json({ message: 'Pincode added successfully', data: newPincode });
  } catch (err) {
    res.status(500).json({ message: 'Error adding pincode', error: err.message });
  }
};

// Update an existing pincode (Admin)
exports.updatePincode = async (req, res) => {
  try {
    const { id } = req.params;
    const { area, isServiceable } = req.body;

    const updatedPincode = await Pincode.findByIdAndUpdate(
      id,
      { area, isServiceable },
      { new: true }
    );

    if (!updatedPincode) {
      return res.status(404).json({ message: 'Pincode not found' });
    }

    res.json({ message: 'Pincode updated successfully', data: updatedPincode });
  } catch (err) {
    res.status(500).json({ message: 'Error updating pincode', error: err.message });
  }
};

// Delete a pincode (Admin)
exports.deletePincode = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Pincode.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Pincode not found' });
    }

    res.json({ message: 'Pincode deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting pincode', error: err.message });
  }
};

// Get all pincodes (Admin)
exports.getAllPincodes = async (req, res) => {
  try {
    const pincodes = await Pincode.find().sort({ pincode: 1 });
    res.json({ count: pincodes.length, data: pincodes });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pincodes', error: err.message });
  }
};

// Get single pincode by ID (Admin)
exports.getPincodeById = async (req, res) => {
  try {
    const { id } = req.params;
    const pincode = await Pincode.findById(id);
    if (!pincode) {
      return res.status(404).json({ message: 'Pincode not found' });
    }
    res.json(pincode);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pincode', error: err.message });
  }
};

// Check if a pincode is serviceable (Public)
exports.checkPincode = async (req, res) => {
  try {
    const { pincode } = req.params;
    const record = await Pincode.findOne({ pincode });
    
    // Fetch all currently serviceable pincodes to show to the user
    const serviceableList = await Pincode.find({ isServiceable: true })
      .select('pincode area -_id')
      .sort({ pincode: 1 });

    if (!record) {
      return res.status(200).json({ 
        serviceable: false, 
        message: 'Sorry, we do not deliver to this pincode yet.',
        serviceableAreas: serviceableList
      });
    }

    if (!record.isServiceable) {
      return res.status(200).json({ 
        serviceable: false, 
        message: 'Delivery currently suspended for this pincode.',
        serviceableAreas: serviceableList
      });
    }

    res.json({ 
      serviceable: true, 
      area: record.area,
      message: 'Yes! We deliver to your location.',
      serviceableAreas: serviceableList
    });
  } catch (err) {
    res.status(500).json({ message: 'Error checking pincode', error: err.message });
  }
};
