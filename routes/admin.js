const router = require("express").Router();
const mongo = require("../models/mongo");

//generate ID for new video entries
const makeid = () => {
  const POSSIBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const TEXTLENGTH = 16;
  let text = "";
  let i = 0;
  while (i < TEXTLENGTH) {
    text += possible.charAt(Math.floor(Math.random() * POSSIBLE.length));
  }
  return text;
};

/* GET home page. */
router.get("/", (req, res, next) => {
  res.render("admin", { title: "Express" });
});

/* POST home page. */
router.post("/", (req, res, next) => {
  res.render("admin", { title: "Express" });
});

//Get Home Page Updates
router.get("/home", (req, res, next) => {
  mongo.getHomeContent((err, home_updates, home_vids) => {
    res.render("admin/home", {
      title: "home",
      home_updates,
      home_vids
    });
  });
});

//Go back to home page with recent edits
router.post("/home", (req, res, next) => {
  mongo.getHomeContent((err, home_updates, home_vids) => {
    res.render("admin/home", {
      title: "home",
      home_updates: req.body,
      home_vids
    });
  });
});

//Preview Home Page Updates
router.post("/home/preview", (req, res, next) => {
  res.render('admin/homeConfirmUpdates', {
    home_updates: req.body
  })
});

//Update changes to MongoDB
router.post("/home/confirmUpdates", (req, res, next) => {
  mongo.updateData("home", { type: "updates" }, req.body, (err, result) => {
    res.redirect("/admin");
  });
});

//add home video
router.get("/home/videos/add", (req, res, next) => {
  res.render("admin/homeVidAdd", {
    title: "Add Home Video"
  });
});

//add home video
router.post("/home/videos/add", (req, res, next) => {
  vidData = req.body;
  vidData._id = makeid();
  vidData.type = "video";
  mongo.insertData("home", vidData, (err, result) => {
    res.redirect("/admin/home");
  });
});

//edit home video
router.get("/home/videos/edit/:id", (req, res, next) => {
  mongo.getHomeContent((err, home_updates, home_vids) => {
    home_vid = home_vids.find(video => video._id == req.params.id);
    if (home_vid) {
      res.render("admin/homeVidEdit", {
        title: "Edit Home Video",
        video: home_vid
      });
    } else {
      res.send("ERROR: Video Not Found");
    }
  });
});

//POST handler to edit home video
router.post("/home/videos/edit/:id", (req, res, next) => {
  home_vid = req.body
  home_vid._id = req.params.id 
  res.render("admin/homeVidEdit", {
    title: "Edit Home Video",
    video: home_vid
  });
});

//POST handler to preview video changes
router.post('/home/videos/preview/:id', (req,res,next) => {
  console.log(req.body)
  res.render("admin/homeConfirmVideos", {
    title: "Edit Home Video",
    video: req.body,
    video_id: req.params.id
  });
});

//POST handler to confirm videos updates
router.post("/home/videos/confirmUpdates/:id", (req, res, next) => {
  mongo.updateData("home", { _id: req.params.id }, req.body, (err, result) => {
    res.redirect("/admin/home");
  });
});

//delete home video
router.post("/home/videos/delete/:id", (req, res, next) => {
  mongo.deleteData("home", { _id: req.params.id }, (err, result) => {
    res.redirect("/admin/home");
  });
});

//Get Modules Home Page (Table of all modules + edit buttons)
router.get("/modules", (req, res, next) => {
  mongo.getData("modules", (err, modulesInfo) => {
    res.render("admin/modules", {
      title: "Modules",
      modules: modulesInfo
    });
  });
});

//Get Page to Edit Module Content
router.get("/modules/:id/edit", (req, res, next) => {
  mongo.getModule(req.params.id, (err, moduleInfo) => {
    res.render("admin/moduleEdit", {
      title: "Edit Module",
      module: moduleInfo
    });
  });
});

router.post("/modules/:id/edit", (req, res, next) => {
  var bodyInfo = req.body;
  console.log(bodyInfo)
  mongo.getModule(req.params.id, (err, moduleInfo) => {
    merged_data = Object.assign(moduleInfo,bodyInfo)
    console.log(moduleInfo);
    console.log(merged_data);
    res.render('admin/moduleEdit', {
      title: "Edit Module",
      module: merged_data,
    });
  });
});

//POST handler for Previewing Module Edits
router.post("/modules/:id/preview", (req, res, next) => {
  var bodyInfo = req.body;
  mongo.getModule(req.params.id, (err, moduleInfo) => {
    merged_data = Object.assign(moduleInfo,bodyInfo)
    console.log(merged_data);
    res.set('X-XSS-Protection', 0);
    res.render('admin/moduleConfirmUpdate', {
      data: merged_data,
    });
  });
});

//POST handler for Module Edits
router.post("/modules/:id/confirmUpdates", (req, res, next) => {
  console.log("Updating Module Edits ", req.body);
  mongo.updateData(
    "modules",
    { _id: parseInt(req.params.id) },
    req.body,
    (err, result) => {
      res.redirect("/admin/modules");
    }
  );
});

//GET page to add video to module
router.get("/modules/:id/videos/add", (req, res, next) => {
  res.render("admin/moduleVideoAdd", {
    moduleID: req.params.id
  });
});

//POST handler to add video to module
router.post("/modules/:id/videos/add", (req, res, next) => {
  vidObject = req.body;
  vidObject._id = makeid();
  mongo.getModule(req.params.id, (err, moduleInfo) => {
    //set position of new video to 1+(POSITION OF LAST VIDEO)
    vidObject.position =
      moduleInfo.videos[moduleInfo.videos.length - 1].position + 1;
    moduleInfo.videos.push(vidObject);
    mongo.updateData(
      "modules",
      { _id: parseInt(req.params.id) },
      moduleInfo,
      (err, result) => {
        res.redirect("/admin/modules/" + req.params.id + "/edit");
      }
    );
  });
});

//GET page to edit video from module
router.get("/modules/:module_id/videos/edit/:video_id", (req, res, next) => {
  mongo.getModule(req.params.module_id, (err, moduleInfo) => {
    vidObject = moduleInfo.videos.find(
      video => video._id == req.params.video_id
    );
    res.render("admin/moduleVideoEdit", {
      title: "Edit Module Video",
      moduleID: req.params.module_id,
      video: vidObject
    });
  });
});

//POST handler to edit video from module
router.post("/modules/:module_id/videos/edit/:video_id", (req, res) => {
  mongo.getModule(req.params.module_id, (err, moduleInfo) => {
    vid_index = moduleInfo.videos.findIndex(
      video => video._id == req.params.video_id
    );
    vidObject = req.body;
    vidObject._id = req.params.video_id;
    vidObject.position = moduleInfo.videos[vid_index].position;
    moduleInfo.videos[vid_index] = vidObject;
    mongo.updateData(
      "modules",
      { _id: parseInt(req.params.module_id) },
      moduleInfo,
      (err, result) => {
        res.redirect("/admin/modules/" + req.params.module_id + "/edit");
      }
    );
  });
});

//POST handler to delete video from module
router.post("/modules/:module_id/videos/delete/:video_id", (req, res) => {
  mongo.getModule(req.params.module_id, (err, moduleInfo) => {
    vid_index = moduleInfo.videos.findIndex(
      video => video._id == req.params.video_id
    );
    if (vid_index > -1) {
      moduleInfo.videos.splice(vid_index, 1);
    }
    mongo.updateData(
      "modules",
      { _id: parseInt(req.params.module_id) },
      moduleInfo,
      (err, result) => {
        res.redirect("/admin/modules/" + req.params.module_id + "/edit");
      }
    );
  });
});

router.get("/badges", (req, res, next) => {
  mongo.getData("badges", (err, badges_data) => {
    res.render("admin/badges", {
      title: "Badges",
      badges: badges_data
    });
  });
});

router.get("/badges/edit/:id", (req, res, next) => {
  mongo.getData("badges", (err, badges_data) => {
    badge_data = badges_data.find(element => element._id == req.params.id);
    res.render("admin/badgeEdit", {
      title: "Badges",
      badge: badge_data
    });
  });
});

router.post("/badges/edit/:id", (req, res, next) => {
  //update badges info
  mongo.updateData(
    "badges",
    { _id: parseInt(req.params.id) },
    {
      Title: req.body.title,
      Description: req.body.description,
      Points: req.body.badge_points,
      Portrait: req.body.portrait,
      PortraitDescription: req.body.portraitdescription
    },
    (err, result) => {
      res.redirect("/admin/badges");
    }
  );
});

router.get("/lucky", (req, res, next) => {
  mongo.getData("lucky_bulldogs", (err, lucky_data) => {
    res.render("admin/lucky", {
      title: "Lucky Bulldog",
      lucky_data: lucky_data
    });
  });
});

router.get("/lucky/edit/:id", (req, res, next) => {
  mongo.getData("lucky_bulldogs", (err, lucky_data) => {
    lucky_bulldog = lucky_data.find(x => x._id == req.params.id);
    res.render("admin/luckyEdit", {
      title: "Lucky Bulldog",
      lucky_bulldog: lucky_bulldog
    });
  });
});

router.post("/lucky/edit/:id", (req, res, next) => {
  mongo.updateData(
    "lucky_bulldogs",
    { _id: parseInt(req.params.id) },
    { time: req.body.date_time },
    (err, result) => {
      res.redirect("/admin/lucky");
    }
  );
});

router.post("/lucky/delete/:id", (req, res, next) => {
  mongo.deleteData(
    "lucky_bulldogs",
    { _id: parseInt(req.params.id) },
    (err, result) => {
      res.redirect("/admin/lucky");
    }
  );
});

router.get("/lucky/add", (req, res, next) => {
  res.render("admin/luckyAdd", {
    title: "Lucky Bulldog"
  });
});

router.post("/lucky/add", (req, res, next) => {
  mongo.getData("lucky_bulldogs", (err, lucky_data) => {
    if (lucky_data.length > 0) {
      new_id = Math.max(lucky_data.map(data => data._id)) + 1;
    } else {
      new_id = 1;
    }
    mongo.insertData(
      "lucky_bulldogs",
      {
        _id: new_id,
        time: req.body.date_time,
        awarded_ids: []
      },
      (err, result) => {
        res.redirect("/admin/lucky");
      }
    );
  });
});

module.exports = router;
