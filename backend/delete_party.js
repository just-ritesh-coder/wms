const mongoose = require('mongoose');
const Party = require('./models/Party');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:50771/')
  .then(async () => {
    const parties = await Party.find().sort({ createdAt: 1 });
    console.log("Total parties:", parties.length);
    
    if (parties.length >= 3) {
      const thirdParty = parties[2];
      console.log("Deleting 3rd party:", thirdParty.name);
      
      await Party.findByIdAndDelete(thirdParty._id);
      
      // Also delete associated user
      if (thirdParty.user) {
        await User.findByIdAndDelete(thirdParty.user);
        console.log("Deleted associated user as well.");
      }
      
      console.log("Successfully deleted.");
    } else {
      console.log("There are less than 3 parties.");
      parties.forEach((p, i) => console.log(`${i+1}: ${p.name}`));
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
