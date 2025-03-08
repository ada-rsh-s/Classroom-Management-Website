import express from "express";
import fs from "fs";
import got from "got";
import studentHelpers from "../helpers/studentHelpers.js";
import tutorHelpers from "../helpers/tutorHelpers.js";
import dotenv from "dotenv";
import {
  generateAccessToken,
  createOrder,
  captureOrder,
} from "../utils/paypalconfig.js";
const userRouter = express.Router();

dotenv.config();
var text, paypalamount;

let notifications;

const studentLogin = (req, res, next) => {
  if (req.session.loggedstudentIn) {
    studentHelpers.getNotifications().then((response) => {
      notifications = response;
    });
    studentHelpers.attendAllPage();
    const chatuser = req.session.student;
    studentHelpers.userTest(req.session.student._id).then((response) => {
      if (response.status) {
        console.log("");
      } else {
        studentHelpers.attendAllPage();
        req.session.destroy();
        res.redirect("/login");
      }
    });
    next();
  } else {
    res.redirect("/login");
  }
};
userRouter.get("/", (req, res) => {
  studentHelpers.attendAllPage();
  res.render("home");
});
userRouter.get("/student", studentLogin, (req, res) => {
  let stud = req.session.student;
  studentHelpers.attendhome(req.session.student._id).then((attendance) => {
    tutorHelpers.getEvents().then((events) => {
      tutorHelpers.getAnnouncements().then((announcement) => {
        studentHelpers
          .attendancenotify(req.session.student._id)
          .then((status) => {
            if (status.status == true) {
              res.render("Student/Stud-home", {
                stud,
                events,
                attendance,
                announcement,
                notifications,
                status,
              });
            } else {
              res.render("Student/Stud-home", {
                stud,
                events,
                attendance,
                announcement,
                notifications,
              });
            }
          });
      });
    });
  });
});
userRouter.get("/login", (req, res) => {
  studentHelpers.attendAllPage();
  if (req.session.loggedstudentIn) {
    res.redirect("/student");
  } else {
    res.render("Student/login", { loginErr: req.session.studentLoginErr });
    req.session.studentLoginErr = false;
  }
});

userRouter.get("/otpnumber", (req, res) => {
  if (req.session.loggedstudentIn) {
    res.redirect("/student");
  } else {
    res.render("Student/otp-number", {
      otpErr: req.session.studentNumErr,
      otpInvalid: req.session.studentOtpInvalid,
    });
    req.session.studentOtpInvalid = false;
    req.session.studentNumErr = false;
    if (req.session.studentOtpInvalid) {
      console.log("");
    } else {
      req.session.destroy();
    }
  }
});
userRouter.post("/otpnumber", (req, res) => {
  studentHelpers.phoneNoCheck(req.body).then((response) => {
    if (response.status == true) {
      req.session.student = response.phone;
      const options = {
        method: "POST",
        url: "https://d7networks.com/api/verifier/send",
        headers: {
          Authorization: "Token cf93c8d28a01f454876166a7841d7b64e724659d",
        },
        formData: {
          mobile: "91" + req.body.Phone,
          sender_id: "D7VERIFY",
          message: "Your otp for classroom login is {code}",
          expiry: "900",
        },
      };
      got(options, function (error, response) {
        if (error) throw new Error(error);
        text = response.body.substring(11, 47);
      });
      res.redirect("/otplogin");
    } else {
      req.session.studentNumErr = "Contact Tutor to register your number";
      res.redirect("/otpnumber");
    }
  });
});
userRouter.get("/otplogin", (req, res) => {
  studentHelpers.attendAllPage();
  if (req.session.student) {
    if (req.session.loggedstudentIn) {
      res.redirect("/");
    } else {
      res.render("Student/otp-login");
    }
  } else {
    res.redirect("/otpnumber");
  }
});
userRouter.post("/otplogin", (req, res) => {
  studentHelpers.OtpCheck(req.body).then((response) => {
    const options = {
      method: "POST",
      url: "https://d7networks.com/api/verifier/verify",
      headers: {
        Authorization: "Token f66f1c31c8cd42263c609d933e96a6dfe81e5ccd",
      },
      formData: {
        otp_id: text,
        otp_code: req.body.otp,
      },
    };
    got(options, function (error, response) {
      if (error) throw new Error(error);
      const status = response.body.substring(11, 17);
      if (status == "failed") {
        req.session.studentOtpInvalid =
          "Invalid OTP.Enter mobile number Once again";
        res.redirect("/otpnumber");
      } else {
        req.session.loggedstudentIn = true;
        res.redirect("/student");
      }
    });
  });
});
userRouter.post("/login", (req, res) => {
  studentHelpers.attendAllPage();
  studentHelpers.doStudentLogin(req.body).then((response) => {
    if (response.status) {
      req.session.student = response.student;
      req.session.loggedstudentIn = true;
      res.redirect("/student");
    } else {
      req.session.studentLoginErr = "Invalid Username or Password";
      res.redirect("/login");
    }
  });
});
userRouter.get("/profile", studentLogin, function (req, res) {
  let studentDetails = req.session.student;
  res.render("Student/Profile", {
    student: true,
    studentDetails,
    notifications,
  });
});
userRouter.get("/studentout", function (req, res) {
  req.session.destroy();
  res.redirect("/login");
});
userRouter.get("/today", studentLogin, (req, res) => {
  studentHelpers.todayNotes().then((doc) => {
    studentHelpers.todayUtube().then((uvideo) => {
      studentHelpers.todayVideo().then((video) => {
        studentHelpers.todayAssignments().then((assignments) => {
          res.render("Student/todays-task", {
            student: true,
            doc,
            video,
            stud: req.session.student,
            uvideo,
            assignments,
            notifications,
          });
        });
      });
    });
  });
});
userRouter.get("/notes", studentLogin, (req, res) => {
  studentHelpers.Notes().then((doc) => {
    studentHelpers.utubeNotes().then((uvideo) => {
      studentHelpers.videoNotes().then((video) => {
        res.render("Student/notes", {
          student: true,
          doc,
          video,
          stud: req.session.student,
          uvideo,
          notifications,
        });
      });
    });
  });
});
userRouter.get("/assignments", studentLogin, (req, res) => {
  studentHelpers.viewAssign().then((assign) => {
    studentHelpers.assignMarks(req.session.student._id).then((submarks) => {
      res.render("Student/assignments", {
        student: true,
        assign,
        notifications,
        submarks,
      });
    });
  }); 
});
userRouter.get("/assignments/:id", studentLogin, (req, res) => {

    res.render("Student/subassign", { student: true, assignId:req.params.id, notifications });

}),
  userRouter.post("/assignments/:id", studentLogin, (req, res) => {
    console.log(req.params.id, req.session.student._id);
    
    studentHelpers
      .submitAssignment(req.params.id, req.session.student._id)
      .then((response) => {
        if (!response.status) {
          let file = req.files.file;
          file.mv("./public/studentAssignment/" + response + ".pdf", (err) => {
            if (!err) {
              res.redirect("/assignments");
            } else {
              console.log(err);
            }
          });
        } else {
          res.render("Student/submitted");
        }
      });
  }),
  userRouter.post("/attendvideo", studentLogin, (req, res) => {
    studentHelpers
      .attendance(req.body, req.session.student._id)
      .then((response) => {
        res.json(response);
      });
  }); 
let datee;
userRouter.post("/attendmonth", studentLogin, (req, res) => {
  datee = req.body.Date;
  res.redirect("/attendate");
});
userRouter.get("/attendate", studentLogin, async (req, res) => {
  let attendance = await studentHelpers.getAttendDate(
    datee,
    req.session.student._id
  );
  let date = datee;
  studentHelpers
    .totalMonthDayPresent(req.session.student._id, date)
    .then((days) => {
      studentHelpers
        .totalMonthDays(req.session.student._id, date)
        .then((totalDays) => {
          studentHelpers
            .totalMonthDayAbsent(req.session.student._id, date)
            .then((totalabs) => {
              studentHelpers
                .totalMonthPercentage(req.session.student._id, date)
                .then((percentage) => {
                  res.render("Student/attend-month", {
                    student: true,
                    attendance,
                    date,
                    days,
                    totalDays,
                    totalabs,
                    percentage,
                    notifications,
                  });
                });
            });
        });
    });
});
userRouter.get("/attendance", studentLogin, async (req, res) => {
  let attendance = await studentHelpers.getfullAttendance(
    req.session.student._id
  );
  studentHelpers.totalDayPresent(req.session.student._id).then((days) => {
    studentHelpers.totalDays(req.session.student._id).then((totalDays) => {
      studentHelpers
        .totalDayAbsent(req.session.student._id)
        .then((totalabs) => {
          studentHelpers
            .totalPercentage(req.session.student._id)
            .then((percentage) => {
              res.render("Student/attendance", {
                student: true,
                attendance,
                days,
                totalDays,
                totalabs,
                percentage,
                notifications,
              });
            });
        });
    });
  });
});
userRouter.get("/announcement", studentLogin, (req, res) => {
  tutorHelpers.getAnnouncements().then((announcement) => {
    res.render("Student/announcement", {
      student: true,
      announcement,
      notifications,
    });
  });
});
userRouter.get("/announcement/:id", studentLogin, (req, res) => {
  studentHelpers.getAnnounceDetails(req.params.id).then((announcement) => {
    let path = "./public/Announcements/pdf/" + announcement._id + ".pdf";
    let path1 = "./public/Announcements/photo/" + announcement._id + ".jpg";
    if (fs.existsSync(path) && fs.existsSync(path1)) {
      let pathimg = "../Announcements/photo/" + announcement._id + ".jpg";
      let pathpdf = "../Notes/open-document.png";
      res.render("Student/announcedetails", {
        student: true,
        announcement,
        pathimg,
        pathpdf,
      });
    } else if (fs.existsSync(path) && !fs.existsSync(path1)) {
      let pathpdf = "../Notes/open-document.png";
      res.render("Student/announcedetails", {
        student: true,
        announcement,
        pathpdf,
        notifications,
      });
    } else if (!fs.existsSync(path) && fs.existsSync(path1)) {
      let pathimg = "../Announcements/photo/" + announcement._id + ".jpg";
      res.render("Student/announcedetails", {
        student: true,
        announcement,
        pathimg,
        notifications,
      });
    } else if (!fs.existsSync(path) && !fs.existsSync(path1)) {
      res.render("Student/announcedetails", { student: true, announcement });
    }
  });
});
userRouter.get("/gallery", studentLogin, (req, res) => {
  studentHelpers.getPhotos().then((photos) => {
    res.render("Student/gallery", { student: true, photos, notifications });
  });
});

userRouter.get("/event/:id", studentLogin, (req, res) => {
  studentHelpers
    .getEventDetails(req.params.id, req.session.student._id)
    .then((event) => {
      let path = "./public/Events/pdf/" + event._id + ".pdf";
      let path1 = "./public/Events/photo/" + event._id + ".jpg";
      if (event.Type == "Free") {
        if (fs.existsSync(path) && fs.existsSync(path1)) {
          let pathimg = "/Events/photo/" + event._id + ".jpg";
          let pathpdf = "/Notes/open-document.png";
          res.render("Student/eventfree", {
            student: true,
            event,
            pathimg,
            pathpdf,
            notifications,
          });
        } else if (fs.existsSync(path) && !fs.existsSync(path1)) {
          let pathpdf = "/Notes/open-document.png";
          res.render("Student/eventfree", {
            student: true,
            event,
            pathpdf,
            notifications,
          });
        } else if (!fs.existsSync(path) && fs.existsSync(path1)) {
          let pathimg = "/Events/photo/" + event._id + ".jpg";
          res.render("Student/eventfree", {
            student: true,
            event,
            pathimg,
            notifications,
          });
        } else if (!fs.existsSync(path) && !fs.existsSync(path1)) {
          res.render("Student/eventfree", {
            student: true,
            event,
            notifications,
          });
        }
      } else if (event.Type == "Paid") {
        let status = "false";

        if (event.students) {
          for (let i = 0; i < event.students.length; i++) {
            if (req.session.student._id == event.students[i]) {
              status = "true";
              {
                break;
              }
            }
          }
          if (status == "false") {
            if (fs.existsSync(path) && fs.existsSync(path1)) {
              let pathimg = "/Events/photo/" + event._id + ".jpg";
              let pathpdf = "/Notes/open-document.png";
              res.render("Student/eventpaid", {
                student: true,
                event,
                pathimg,
                pathpdf,
                stud: req.session.student,
                notifications,
              });
            } else if (fs.existsSync(path) && !fs.existsSync(path1)) {
              let pathpdf = "/Notes/open-document.png";
              res.render("Student/eventpaid", {
                student: true,
                event,
                pathpdf,
                stud: req.session.student,
              });
            } else if (!fs.existsSync(path) && fs.existsSync(path1)) {
              let pathimg = "/Events/photo/" + event._id + ".jpg";
              res.render("Student/eventpaid", {
                student: true,
                event,
                pathimg,
                stud: req.session.student,
                notifications,
              });
            } else if (!fs.existsSync(path) && !fs.existsSync(path1)) {
              res.render("Student/eventpaid", {
                student: true,
                event,
                stud: req.session.student,
              });
            }
          } else if (status == "true") {
            if (fs.existsSync(path) && fs.existsSync(path1)) {
              let pathimg = "/Events/photo/" + event._id + ".jpg";
              let pathpdf = "/Notes/open-document.png";
              res.render("Student/event-done", {
                student: true,
                event,
                pathimg,
                pathpdf,
                stud: req.session.student,
                notifications,
              });
            } else if (fs.existsSync(path) && !fs.existsSync(path1)) {
              let pathpdf = "/Notes/open-document.png";
              res.render("Student/event-done", {
                student: true,
                event,
                pathpdf,
                stud: req.session.student,
                notifications,
              });
            } else if (!fs.existsSync(path) && fs.existsSync(path1)) {
              let pathimg = "/Events/photo/" + event._id + ".jpg";
              res.render("Student/event-done", {
                student: true,
                event,
                pathimg,
                stud: req.session.student,
                notifications,
              });
            } else if (!fs.existsSync(path) && !fs.existsSync(path1)) {
              res.render("Student/event-done", {
                student: true,
                event,
                stud: req.session.student,
                notifications,
              });
            }
          }
        } else {
          if (fs.existsSync(path) && fs.existsSync(path1)) {
            let pathimg = "/Events/photo/" + event._id + ".jpg";
            let pathpdf = "/Notes/open-document.png";
            res.render("Student/eventpaid", {
              student: true,
              event,
              pathimg,
              pathpdf,
              stud: req.session.student,
              notifications,
            });
          } else if (fs.existsSync(path) && !fs.existsSync(path1)) {
            let pathpdf = "/Notes/open-document.png";
            res.render("Student/eventpaid", {
              student: true,
              event,
              pathpdf,
              stud: req.session.student,
              notifications,
            });
          } else if (!fs.existsSync(path) && fs.existsSync(path1)) {
            let pathimg = "/Events/photo/" + event._id + ".jpg";
            res.render("Student/eventpaid", {
              student: true,
              event,
              pathimg,
              stud: req.session.student,
              notifications,
            });
          } else if (!fs.existsSync(path) && !fs.existsSync(path1)) {
            res.render("Student/eventpaid", {
              student: true,
              event,
              stud: req.session.student,
              notifications,
            });
          }
        }
      }
    });
});
userRouter.get("/success", (req, res) => {
  res.render("Student/success");
});
userRouter.get("/failed", studentLogin, (req, res) => {
  res.render("Student/failed");
});
userRouter.post("/payevent", studentLogin, (req, res) => {
  studentHelpers
    .generateRazorPay(req.body, req.body.amount)
    .then((response) => {
      res.json(response);
    });
});
userRouter.post("/verify-payment", studentLogin, (req, res) => {
  studentHelpers
    .verifyPayment(req.body, req.session.student._id)
    .then(() => {
      studentHelpers
        .eventBook(req.body["order[receipt]"], req.session.student._id)
        .then(() => {
          res.json({ status: true });
        });
    })
    .catch((err) => {
      console.log(err);
      res.json({ status: false, errMsg: "" });
    });
});

userRouter.post("/paypal", studentLogin, (req, res) => {
  generateAccessToken().then((accessToken) => {
    createOrder(accessToken, req.body).then((url) => {
      res.redirect(url.href);
    });
  });
});
userRouter.get("/paypalsuccess", studentLogin, async (req, res) => {
  try {
    console.log(req.query.token);
    const accessToken = await generateAccessToken();
    await captureOrder(accessToken, req.query.token).then((response) => {
      const studEventData = JSON.parse(
        response.purchase_units[0].payments.captures[0].custom_id
      );
      const studId = studEventData.studId;
      const eventId = studEventData.eventId;

      console.log(studId, eventId);

      studentHelpers.eventBook(eventId, studId).then((response) => {
        studentHelpers.paytmAdd(studId, eventId).then((response) => {
          res.redirect("/success");
        });
      });
    });
  } catch (error) {}
  // const payerId = req.query.PayerID;
  // const paymentId = req.query.paymentId;

  // const execute_payment_json = {
  //   payer_id: payerId,
  //   transactions: [
  //     {
  //       amount: {
  //         currency: "USD",
  //         total: paypalamount,
  //       },
  //     },
  //   ],
  // };
  // paypal.payment.execute(
  //   paymentId,
  //   execute_payment_json,
  //   function (error, payment) {
  //     if (error) {
  //       console.log(error);
  //       res.redirect("/failed");
  //     } else {
  //       studentHelpers
  //         .eventBook(
  //           payment.transactions[0].description,
  //           req.session.student._id
  //         )
  //         .then((response) => {
  //           studentHelpers
  //             .paytmAdd(
  //               req.session.student._id,
  //               payment.transactions[0].description
  //             )
  //             .then((response) => {
  //               res.redirect("/success");
  //             });
  //         });
  //     }
  //   }
  // );
});
userRouter.get("/events", studentLogin, (req, res) => {
  tutorHelpers.getEvents().then((events) => {
    res.render("Student/events", { student: true, events, notifications });
  });
});

userRouter.get("/chat", studentLogin, (req, res) => {
  studentHelpers.getChat().then((chat) => {
    studentHelpers.getAllStudentsChat(req.session.student._id).then((stud) => {
      res.render("Student/chat", {
        student: true,
        notifications,
        chat,
        stud,
        stuDetails: req.session.student,
      });
    });
  });
});
userRouter.get("/pvtchat/:id", studentLogin, (req, res) => {
  let studId = req.session.student._id;
  let chatId = req.params.id;
    tutorHelpers.getAllStudents().then((stud) => {
      studentHelpers
        .getPvtChat(req.session.student._id, req.params.id)
        .then((chat) => {
          res.render("Student/pvtchat", {
            student: true,
            notifications,
            stud,
            studId,
            chatId,
            chat,
          });
        }); 
    });
});

export default userRouter;
