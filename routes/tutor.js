import express from "express";
import fs from "fs";
const tutorRouter = express.Router();
import studentHelpers from "../helpers/studentHelpers.js";
import tutorHelpers from "../helpers/tutorHelpers.js";

const tutorLogin = (req, res, next) => {
  if (req.session.loggedTutorIn) {
    studentHelpers.attendAllPage();
    next();
  } else {
    studentHelpers.attendAllPage();
    res.redirect("/tutor/login");
  }
};

tutorRouter.get("/", tutorLogin, (req, res) => {
  tutorHelpers.tutorProfileDetails().then((teacher) => {
    tutorHelpers.getAnnouncements().then((announcement) => {
      tutorHelpers.getEvents().then((events) => {
        res.render("Tutor/tutor-home", { teacher, announcement, events });
      });
    });
  });
});

tutorRouter.get("/announcement/:id", tutorLogin, (req, res) => {
  studentHelpers.getAnnounceDetails(req.params.id).then((announcement) => {

    let path = "./public/Announcements/pdf/" + announcement._id + ".pdf";
    let path1 = "./public/Announcements/photo/" + announcement._id + ".jpg";
    if (fs.existsSync(path) && fs.existsSync(path1)) {
      let pathimg = "/Announcements/photo/" + announcement._id + ".jpg";
      let pathpdf = "/Notes/open-document.png";
      res.render("Tutor/announcedetails", {
        tutor: true,
        announcement,
        pathimg,
        pathpdf,
      });
    } else if (fs.existsSync(path) && !fs.existsSync(path1)) {
      let pathpdf = "/Notes/open-document.png";
      res.render("Tutor/announcedetails", {
        tutor: true,
        announcement,
        pathpdf,
      });
    } else if (!fs.existsSync(path) && fs.existsSync(path1)) {
      let pathimg = "/Announcements/photo/" + announcement._id + ".jpg";
      res.render("Tutor/announcedetails", {
        tutor: true,
        announcement,
        pathimg,
      });
    } else if (!fs.existsSync(path) && !fs.existsSync(path1)) {
      res.render("Tutor/announcedetails", { tutor: true, announcement });
    }
  });
});

tutorRouter.get("/login", (req, res) => {
  studentHelpers.attendAllPage();
  if (req.session.loggedTutorIn) {
    res.redirect("/");
  } else {
    tutorHelpers.tutorCheck().then((response) => {
      if (response) {
        res.render("Tutor/tutorlogin", { loginErr: req.session.tutorLoginErr });
        req.session.tutorLoginErr = false;
      } else {
        res.render("Tutor/register");
      }
    });
  }
});

tutorRouter.post("/register", (req, res) => {
  tutorHelpers.tutorRegister(req.body).then((id) => {
    id = id.insertedId;
    let image = req.files.Image;
    image.mv("./public/Tutor-image/" + id + ".jpg", (err) => {
      if (!err) {
        res.redirect("/tutor/login");
      } else {
        console.log(err);
      }
    });
  });
});

tutorRouter.post("/login", (req, res) => {
  tutorHelpers.doTutorLogin(req.body).then((response) => {
    if (response.status) {
      req.session.tutor = response.tutor;
      req.session.loggedTutorIn = true;
      res.redirect("/tutor");
    } else {
      req.session.tutorLoginErr = "Invalid Username or Password";
      res.redirect("/tutor/login");
    }
  });
});


tutorRouter.get("/tutorout", function (req, res) {
  req.session.destroy();
  res.redirect("/tutor/login");
});

tutorRouter.get("/students", tutorLogin, function (req, res) {
  tutorHelpers.getAllStudents().then((students) => {
    res.render("Tutor/studtable", { tutor: true, students });
  });
});

tutorRouter.get("/profile", tutorLogin, function (req, res) {
  tutorHelpers.tutorProfileDetails().then((teacher) => {
    res.render("Tutor/profile", { tutor: true, teacher });
  });
});

tutorRouter.post("/profile", (req, res) => {
  tutorHelpers.tutorProfile(req.body, (id) => {
    let image = req.files.Tutimage;
    image.mv("./public/Tutor-image/" + id + ".jpg", (err) => {
      if (!err) {
        res.redirect("/tutor/profile");
      } else {
        console.log(err);
      }
    });
  });
});

tutorRouter.post("/editutor/:id", tutorLogin, (req, res) => {
  let id = req.params.id;
  tutorHelpers.updateTutDetails(req.params.id, req.body).then(() => {
    res.redirect("/tutor/profile");
    console.log(req.files);
    
    if (req.files!==null) {
      let image = req.files.Tutimage;
      image.mv("./public/Tutor-image/" + id + ".jpg");
    }
  });
});

tutorRouter.post("/manualattend", (req, res) => {
  tutorHelpers.manualAttend(req.body.studId).then((response) => {
    res.json(response);
  });
});

tutorRouter.get("/attendance", tutorLogin, async (req, res) => {
  let datecheck =
    ("0" + new Date().getDate()).slice(-2) +
    "-" +
    ("0" + (new Date().getMonth() + 1)).slice(-2) +
    "-" +
    new Date().getFullYear();
  let attendance = await tutorHelpers.getAttendance();
  res.render("Tutor/Attendance", { tutor: true, attendance, datecheck });
});


tutorRouter.get("/attendate/:id", tutorLogin, async (req, res) => {
  let attendance = await tutorHelpers.getAttendDate(req.params.id);
  let date = req.params.id;
  res.render("Tutor/attend-date", { tutor: true, attendance, date });
});


tutorRouter.get("/assignments", tutorLogin, (req, res) => {
  let date =
    ("0" + new Date().getDate()).slice(-2) +
    "-" +
    ("0" + (new Date().getMonth() + 1)).slice(-2) +
    "-" +
    new Date().getFullYear();
  tutorHelpers.viewAssign().then((assign) => {
    res.render("Tutor/assignment", { tutor: true, assign, date });
  });
});


tutorRouter.post("/assignments", (req, res) => {
  tutorHelpers.addAssign(req.body).then((response) => {
    let file = req.files.file;
    file.mv("./public/Assignments/" + response + ".pdf", (err) => {
      if (!err) {
        res.redirect("/tutor/assignments");
      } else {
        console.log(err);
      }
    });
  });
});


tutorRouter.get("/delete-assign/:id", tutorLogin, (req, res) => {
  let assignId = req.params.id;
  tutorHelpers.deleteAssign(assignId).then((response) => {
    res.redirect("/tutor/assignments");
  });
});
tutorRouter.get("/notes", tutorLogin, (req, res) => {
  studentHelpers.Notes().then((doc) => {
    studentHelpers.utubeNotes().then((uvideo) => {
      studentHelpers.videoNotes().then((video) => {
        res.render("Tutor/notes", {
          tutor: true,
          doc,
          video,
          stud: req.session.student,
          uvideo,
        });
      });
    });
  });
});


tutorRouter.get("/announcement", tutorLogin, (req, res) => {
  let date =
    ("0" + new Date().getDate()).slice(-2) +
    "-" +
    ("0" + (new Date().getMonth() + 1)).slice(-2) +
    "-" +
    new Date().getFullYear();
  res.render("Tutor/announcement", { tutor: true, date });
});


tutorRouter.post("/announcement", (req, res) => {
  tutorHelpers.addAnnouncement(req.body, (id) => {
    if (req.files.file && !req.files.pdf && !req.files.video) {
      if (req.body.im == "") {
        let image = req.files.file;
        image.mv("./public/Announcements/photo/" + id + ".jpg", (err) => {
          if (!err) {
            res.redirect("/tutor/announcement");
          } else {
            console.log(err);
          }
        });
      } else {
        res.redirect("/tutor/announcement");
      }
    } else if (req.files.pdf && !req.files.file && !req.files.video) {
      let pdf = req.files.pdf;
      pdf.mv("./public/Announcements/pdf/" + id + ".pdf", (err) => {
        if (!err) {
          res.redirect("/tutor/announcement");
        } else {
          console.log(err);
        }
      });
    } else if (req.files.video && !req.files.file && !req.files.pdf) {
      let video = req.files.video;
      video.mv("./public/Announcements/video/" + id + ".mp4", (err) => {});
    } else if (req.files.file && req.files.pdf && !req.files.video) {
      let pdf = req.files.pdf;
      pdf.mv("./public/Announcements/pdf/" + id + ".pdf", (err) => {});
      if (req.body.im == "") {
        let image = req.files.file;
        image.mv("./public/Announcements/photo/" + id + ".jpg", (err) => {
          if (!err) {
            res.redirect("/tutor/announcement");
          } else {
            console.log(err);
          }
        });
      } else {
        res.redirect("/tutor/announcement");
      }
    } else if (req.files.file && !req.files.pdf && req.files.video) {
      let video = req.files.video;
      video.mv("./public/Announcements/video/" + id + ".mp4", (err) => {});
      if (req.body.im == "") {
        let image = req.files.file;
        image.mv("./public/Announcements/photo/" + id + ".jpg", (err) => {
          if (!err) {
            res.redirect("/tutor/announcement");
          } else {
            console.log(err);
          }
        });
      } else {
        res.redirect("/tutor/announcement");
      }
    } else if (!req.files.file && req.files.pdf && req.files.video) {
      let video = req.files.video;
      video.mv("./public/Announcements/video/" + id + ".mp4", (err) => {});
      let pdf = req.files.pdf;
      pdf.mv("./public/Announcements/pdf/" + id + ".pdf", (err) => {
        res.redirect("/tutor/announcement");
      });
    } else if (req.files.file && req.files.pdf && req.files.video) {
      let video = req.files.video;
      video.mv("./public/Announcements/video/" + id + ".mp4", (err) => {});
      let pdf = req.files.pdf;
      pdf.mv("./public/Announcements/pdf/" + id + ".pdf", (err) => {});
      if (req.body.im == "") {
        let image = req.files.file;
        image.mv("./public/Announcements/photo/" + id + ".jpg", (err) => {
          if (!err) {
            res.redirect("/tutor/announcement");
          } else {
            console.log(err);
          }
        });
      } else {
        res.redirect("/tutor/announcement");
      }
    }
  });
});


tutorRouter.get("/events", tutorLogin, (req, res) => {
  res.render("Tutor/Events", { tutor: true });
});


tutorRouter.post("/event", (req, res) => {
  tutorHelpers.addEvent(req.body, (id) => {
    if (req.files.file && !req.files.pdf && !req.files.video) {
      if (req.body.im == "") {
        let image = req.files.file;
        image.mv("./public/Events/photo/" + id + ".jpg", (err) => {
          if (!err) {
            res.redirect("/tutor/events");
          } else {
            console.log(err);
          }
        });
      } else {
        res.redirect("/tutor/events");
      }
    } else if (req.files.pdf && !req.files.file && !req.files.video) {
      let pdf = req.files.pdf;
      pdf.mv("./public/Events/pdf/" + id + ".pdf", (err) => {
        if (!err) {
          res.redirect("/tutor/events");
        } else {
          console.log(err);
        }
      });
    } else if (req.files.video && !req.files.file && !req.files.pdf) {
      let video = req.files.video;
      video.mv("./public/Events/video/" + id + ".mp4", (err) => {
        res.redirect("/tutor/events");
      });
    } else if (req.files.file && req.files.pdf && !req.files.video) {
      let pdf = req.files.pdf;
      pdf.mv("./public/Events/pdf/" + id + ".pdf", (err) => {});
      if (req.body.im == "") {
        let image = req.files.file;
        image.mv("./public/Events/photo/" + id + ".jpg", (err) => {
          if (!err) {
            res.redirect("/tutor/events");
          } else {
            console.log(err);
          }
        });
      } else {
        res.redirect("/tutor/events");
      }
    } else if (req.files.file && !req.files.pdf && req.files.video) {
      let video = req.files.video;
      video.mv("./public/Events/video/" + id + ".mp4", (err) => {});
      if (req.body.im == "") {
        let image = req.files.file;
        image.mv("./public/Events/photo/" + id + ".jpg", (err) => {
          if (!err) {
            res.redirect("/tutor/events");
          } else {
            console.log(err);
          }
        });
      } else {
        res.redirect("/tutor/events");
      }
    } else if (!req.files.file && req.files.pdf && req.files.video) {
      let video = req.files.video;
      video.mv("./public/Events/video/" + id + ".mp4", (err) => {});
      let pdf = req.files.pdf;
      pdf.mv("./public/Events/pdf/" + id + ".pdf", (err) => {
        res.redirect("/tutor/events");
      });
    } else if (req.files.file && req.files.pdf && req.files.video) {
      let video = req.files.video;
      video.mv("./public/Events/video/" + id + ".mp4", (err) => {});
      let pdf = req.files.pdf;
      pdf.mv("./public/Events/pdf/" + id + ".pdf", (err) => {});
      if (req.body.im == "") {
        let image = req.files.file;
        image.mv("./public/Events/photo/" + id + ".jpg", (err) => {
          if (!err) {
            res.redirect("/tutor/events");
          } else {
            console.log(err);
          }
        });
      } else {
        res.redirect("/tutor/events");
      }
    }
  });
});

tutorRouter.get("/event/:id", tutorLogin, (req, res) => {
  tutorHelpers.getEventDetails(req.params.id).then((event) => {
    tutorHelpers.getPaidStudents(req.params.id).then((stud) => {
        let path = "./public/Events/pdf/" + event._id + ".pdf";
      let path1 = "./public/Events/photo/" + event._id + ".jpg";
      if (fs.existsSync(path) && fs.existsSync(path1)) {
        let pathimg = "/Events/photo/" + event._id + ".jpg";
        let pathpdf = "/Notes/open-document.png";
        res.render("Tutor/eventdetails", {
          tutor: true,
          event,
          pathimg,
          pathpdf,
          stud,
        });
      } else if (fs.existsSync(path) && !fs.existsSync(path1)) {
        let pathpdf = "/Notes/open-document.png";
        res.render("Tutor/eventdetails", { tutor: true, event, pathpdf, stud });
      } else if (!fs.existsSync(path) && fs.existsSync(path1)) {
        let pathimg = "/Events/photo/" + event._id + ".jpg";
        res.render("Tutor/eventdetails", { tutor: true, event, pathimg, stud });
      } else if (!fs.existsSync(path) && !fs.existsSync(path1)) {
        res.render("Tutor/eventdetails", { tutor: true, event, stud });
      }
    });
  });
});


tutorRouter.get("/photos", tutorLogin, (req, res) => {
  studentHelpers.getPhotos().then((photos) => {
    res.render("Tutor/photos", { tutor: true, photos });
  });
});

 
let rollstatus = false;
tutorRouter.get("/addstudent", tutorLogin, (req, res) => {
  res.render("Tutor/add-student", { tutor: true, rollstatus });
  rollstatus = false;
});


tutorRouter.post("/addstudent", (req, res) => {
  tutorHelpers.addStudent(req.body).then((id) => {
    if (id.status != true) {
      tutorHelpers.singleattendance(id);
      let image = req.files.Image;
      image.mv("./public/student-images/" + id + ".jpg", (err) => {
        if (!err) {
          res.redirect("/tutor/addstudent");
        } else {
          console.log(err);
        }
      });
    } else {
      rollstatus = true;
      res.redirect("/tutor/addstudent");
    }
  });
});


tutorRouter.get("/studetails/:id", tutorLogin, async (req, res) => {
  let attendance = await tutorHelpers.getstudAttend(req.params.id);
  let assignments = await tutorHelpers.getAssignments(req.params.id);
  let stud = await tutorHelpers.getStudentDetails(req.params.id);
  res.render("Tutor/studetails", {
    assignments,
    tutor: true,
    attendance,
    stud,
  });
});


tutorRouter.get("/editstud/:id", tutorLogin, async (req, res) => {
  let stud = await tutorHelpers.getStudentDetails(req.params.id);
  res.render("Tutor/Edit-Student", { tutor: true, stud });
});


tutorRouter.post("/editstud/:id", tutorLogin, (req, res) => {
  let id = req.params.id;
  tutorHelpers.updateStudDetails(req.params.id, req.body).then(() => {
    res.redirect("/tutor/students");
    if (req.files.Image) {
      let image = req.files.Image;
      image.mv("./public/student-images/" + id + ".jpg");
    }
  });
});


tutorRouter.get("/delete-student/:id", tutorLogin, (req, res) => {
  let studId = req.params.id;
  tutorHelpers.deleteStudent(studId).then(() => {
    res.redirect("/tutor/students");
  });
});


tutorRouter.get("/doc", tutorLogin, (req, res) => {
  let date =
    ("0" + new Date().getDate()).slice(-2) +
    "-" +
    ("0" + (new Date().getMonth() + 1)).slice(-2) +
    "-" +
    new Date().getFullYear();
  res.render("Tutor/doc", { tutor: true, date });
});


tutorRouter.post("/doc", (req, res) => {
  tutorHelpers.docNotes(req.body, (id) => {
    let image = req.files.file;
    image.mv("./public/Notes/doc/" + id + ".pdf", (err) => {
      if (!err) {
        res.redirect("/tutor/notes");
      } else {
        console.log(err);
      }
    });
  });
});


tutorRouter.get("/vid", tutorLogin, (req, res) => {
  let date =
    ("0" + new Date().getDate()).slice(-2) +
    "-" +
    ("0" + (new Date().getMonth() + 1)).slice(-2) +
    "-" +
    new Date().getFullYear();
  res.render("Tutor/video", { tutor: true, date });
});


tutorRouter.post("/vid", (req, res) => {
  tutorHelpers.vidNotes(req.body, (id) => {
    let video = req.files.file;
    video.mv("./public/Notes/videos/" + id + ".mp4", (err) => {
      if (!err) {
        res.redirect("/tutor/notes");
      } else {
        console.log(err);
      }
    });
  });
});


tutorRouter.get("/uvid", tutorLogin, (req, res) => {
  let date =
    ("0" + new Date().getDate()).slice(-2) +
    "-" +
    ("0" + (new Date().getMonth() + 1)).slice(-2) +
    "-" +
    new Date().getFullYear();
  res.render("Tutor/Utubevid", { tutor: true, date });
});


tutorRouter.post("/uvid", (req, res) => {
  console.log(req.body);
  tutorHelpers.uvidNotes(req.body).then((response) => {
    res.redirect("/tutor/notes");
  });
});


tutorRouter.post("/photos", (req, res) => {
  tutorHelpers.addPhotos(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/Photos/" + id + ".jpg", (err) => {
      if (!err) {
        res.redirect("/tutor/photos");
      } else {
        console.log(err);
      }
    });
  });
});


tutorRouter.get("/delete-photo/:id", tutorLogin, (req, res) => {
  let photoId = req.params.id;
  tutorHelpers.deletePhoto(photoId).then((response) => {
    res.redirect("/tutor/photos");
  });
});


tutorRouter.get("/announcedelete/:id", tutorLogin, (req, res) => {
  let announceId = req.params.id;
  tutorHelpers.deleteAnnounce(announceId).then((response) => {
    res.redirect("/tutor");
  });
});


tutorRouter.get("/eventdelete/:id", tutorLogin, (req, res) => {
  let eventId = req.params.id;
  tutorHelpers.deleteEvent(eventId).then((response) => {
    res.redirect("/tutor");
  });
});


tutorRouter.get("/notesdocdelete/:id", tutorLogin, (req, res) => {
  let docId = req.params.id;
  tutorHelpers.deleteDoc(docId).then((response) => {
    res.redirect("/tutor/notes");
  });
});


tutorRouter.get("/notesviddelete/:id", tutorLogin, (req, res) => {
  let vidId = req.params.id;
  tutorHelpers.deleteVid(vidId).then((response) => {
    res.redirect("/tutor/notes");
  });
});


tutorRouter.get("/notesyoudelete/:id", tutorLogin, (req, res) => {
  let youId = req.params.id;
  tutorHelpers.deleteYou(youId).then((response) => {
    res.redirect("/tutor/notes");
  });
});


tutorRouter.get("/holiday", tutorLogin, (req, res) => {
  res.render("Tutor/holiday", { tutor: true });
});


tutorRouter.post("/holiday", tutorLogin, (req, res) => {
  tutorHelpers.addHoliday(req.body.Date, req.body).then((response) => {
    res.redirect("/tutor/holiday");
  });
});


tutorRouter.post("/marks", (req, res) => {
  tutorHelpers
    .subMarks(req.body.Mark, req.body.Assign, req.body.Stud)
    .then((mark) => {
      res.json(mark);
    });
});


tutorRouter.get("/chat", tutorLogin, (req, res) => {
  studentHelpers.getChat().then((chat) => {
    res.render("Tutor/tutorchat", {
      tutor: true,
      chat,
      tutDetails: req.session.tutor,
    });
  });
});

export default tutorRouter;

