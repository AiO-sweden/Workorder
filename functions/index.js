const {onRequest} = require("firebase-functions/v2/https");
const {onObjectFinalized} = require("firebase-functions/v2/storage");
const admin = require("firebase-admin");
const {
  getFirestore,
  Timestamp,
  // FieldValue, // Not used while uploadSupplierFile is minimal
  query,
  where,
  getDocs,
  collection,
  doc,
  addDoc,
} = require("firebase-admin/firestore");
// const Busboy = require("busboy"); // Still commented out
const os = require("os");
const path = require("path");
const fs = require("fs");
const Papa = require("papaparse");
const cheerio = require("cheerio");

admin.initializeApp();

const db = getFirestore();
// const storage = admin.storage(); // For uploadSupplierFile, keep commented

exports.uploadSupplierFile = onRequest({
  region: "europe-west1",
}, async (req, res) => {
  console.log("uploadSupplierFile triggered (minimal)");
  res.set("Access-Control-Allow-Origin", "http://localhost:3000");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
  );

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  res.status(200).send("uploadSupplierFile (minimal) executed successfully!");
  /*
  // eslint-disable-next-line new-cap
  const busboy = Busboy({headers: req.headers});
  const tmpdir = os.tmpdir();
  const fields = {};
  const uploads = {};

  busboy.on("field", (fieldname, val) => {
    console.log(`Processed field ${fieldname}: ${val}`);
    fields[fieldname] = val;
  });

  busboy.on("file", (fieldname, file, MimeType) => {
    const {filename, encoding, mimeType} = MimeType;
    console.log(`Processed file ${filename} (${fieldname})`);
    console.log(`  Encoding: ${encoding}, MIME type: ${mimeType}`);
    const filepath = path.join(tmpdir, filename);
    uploads[fieldname] = {filepath, MimeType};
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on("finish", async () => {
    const {supplierId, fileType} = fields;
    if (!supplierId || !fileType) {
      res.status(400).json({error: "Missing supplierId or fileType."});
      return;
    }

    const uploadedFileField = Object.keys(uploads)[0];
    if (!uploadedFileField) {
      res.status(400).json({error: "No file uploaded."});
      return;
    }

    const fileData = uploads[uploadedFileField];
    const {filepath, MimeType} = fileData;
    const {filename} = MimeType;

    const bucket = storage.bucket("aio-arbetsorder.firebasestorage.app");
    const destination =
      `supplierFiles/${supplierId}/${Date.now()}_${filename}`;

    try {
      const [uploadedFile] = await bucket.upload(filepath, {
        destination: destination,
        metadata: {contentType: MimeType.mimeType},
      });
      fs.unlinkSync(filepath);

      const downloadURL = await uploadedFile.getSignedUrl({
        action: "read",
        expires: "03-09-2491",
      }).then((urls) => urls[0]);

      const supplierDocRef = doc(db, "suppliers", supplierId);
      const supplierSnap = await supplierDocRef.get();

      const newFileEntry = {
        fileName: filename,
        storagePath: destination,
        downloadURL,
        uploadDate: Timestamp.now(),
        fileType: fileType,
        processingStatus: "pending",
      };

      if (!supplierSnap.exists) {
        await supplierDocRef.set({
          name: supplierId,
          configured: true,
          priceFiles: [newFileEntry],
        }, {merge: true});
      } else {
        await supplierDocRef.update({
          priceFiles: FieldValue.arrayUnion(newFileEntry),
          configured: true,
        });
      }

      console.log(
          `File ${filename} uploaded to ${destination} and info saved ` +
          `to Firestore for supplier ${supplierId}.`,
      );
      res.status(200).json({
        message: "File uploaded successfully!",
        fileName: filename,
        downloadURL: downloadURL,
      });
    } catch (error) {
      console.error("Error during upload or Firestore update:", error);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
      res.status(500).json({
        error: "Failed to upload file or update database.",
        details: error.message,
      });
    }
  });

  if (req.rawBody) {
    busboy.end(req.rawBody);
  } else {
    req.pipe(busboy);
  }
  */
});

exports.processSupplierFileNew = onObjectFinalized({ // Renamed function
  bucket: "aio-arbetsorder.firebasestorage.app",
  region: "europe-west1",
}, async (event) => {
  console.log("processSupplierFileNew triggered (minimal)"); // Updated log
  console.log("Event data:", JSON.stringify(event.data));
  // /* // Remove start of block comment
  const object = event.data;
  const filePath = object.name;
  const contentType = object.contentType;
  const bucketName = object.bucket;

  console.log(`Processing file: ${filePath} (Content-Type: ${contentType})`);

  if (!filePath || filePath.endsWith("/")) {
    console.log("This is a directory or an empty path, skipping.");
    return null;
  }

  const pathParts = filePath.split("/");
  if (pathParts.length < 3 || pathParts[0] !== "supplierFiles") {
    console.log(
        `File ${filePath} not in supplierFiles path, skipping.`,
    );
    return null;
  }
  const supplierIdFromFile = pathParts[1];

  const isCsv = contentType && contentType.includes("csv");
  const isTxt = contentType && contentType.includes("text/plain");

  if (!isCsv && !isTxt) {
    console.log(
        `File ${filePath} is not CSV or TXT (${contentType}), skipping.`,
    );
    return null;
  }
  console.log(
      `Processing ${isCsv ? "CSV" : "TXT"} file for: ${supplierIdFromFile}`,
  );

  const bucket = admin.storage().bucket(bucketName);
  const tempFileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), tempFileName);

  try {
    await bucket.file(filePath).download({destination: tempFilePath});
    console.log(`File ${filePath} downloaded to ${tempFilePath}.`);

    const fileContent = fs.readFileSync(tempFilePath, "utf8");
    let articlesToProcess = [];

    if (isCsv) {
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
      });
      if (parseResult.errors.length > 0) {
        console.error("CSV Parsing errors:", parseResult.errors);
        throw new Error("Failed to parse CSV content.");
      }
      articlesToProcess = parseResult.data;
    } else if (isTxt) {
      const parseResult = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
      });
      if (parseResult.errors.length > 0) {
        console.warn("TXT Parsing errors/warnings:", parseResult.errors);
      }
      articlesToProcess = parseResult.data;
    }

    console.log(`Found ${articlesToProcess.length} potential articles.`);
    if (articlesToProcess.length === 0) {
      console.log("No articles to process from file.");
      fs.unlinkSync(tempFilePath);
      return null;
    }

    console.log("First 5 articles (raw):");
    for (let i = 0; i < Math.min(articlesToProcess.length, 5); i++) {
      console.log(JSON.stringify(articlesToProcess[i]));
    }

    const articlesCollectionRef = collection(db, "articles");
    const batch = db.batch();
    let articlesAddedCount = 0;
    let articlesUpdatedCount = 0;

    for (const item of articlesToProcess) {
      const articleNumber = item.Artikelnummer || item.ArtNr ||
                            item.ARTNR || item["Article No."];
      const name = item.Benämning || item.Artikelbenämning ||
                   item.NAME || item.Name;
      const purchasePrice = parseFloat(
          item.Inpris || item["Purchase Price"] || item.NETTOPRIS,
      );
      const unit = item.Enhet || item.Unit || item.ENHET || "st";

      if (!articleNumber || !name) {
        console.warn(
            "Skipping item due to missing article number or name:", item,
        );
        continue;
      }

      const articleData = {
        articleNumber: String(articleNumber).trim(),
        name: String(name).trim(),
        purchasePrice: isNaN(purchasePrice) ? 0 : purchasePrice,
        unit: String(unit).trim(),
        supplier: supplierIdFromFile,
        category: `Grossist - ${supplierIdFromFile}`,
        lastUpdated: Timestamp.now(),
      };

      const articleQuery = query(
          articlesCollectionRef,
          where("articleNumber", "==", articleData.articleNumber),
          where("supplier", "==", supplierIdFromFile),
      );
      const querySnapshot = await getDocs(articleQuery);

      if (querySnapshot.empty) {
        const newArticleRef = doc(articlesCollectionRef);
        batch.set(newArticleRef, articleData);
        articlesAddedCount++;
      } else {
        querySnapshot.forEach((docSnapshot) => {
          batch.update(docSnapshot.ref, articleData);
          articlesUpdatedCount++;
        });
      }
    }

    if (articlesAddedCount > 0 || articlesUpdatedCount > 0) {
      await batch.commit();
      console.log(
          `Batch commit: ${articlesAddedCount} added, ` +
          `${articlesUpdatedCount} updated for ${supplierIdFromFile}.`,
      );
    } else {
      console.log(
          `No articles to add or update for ${supplierIdFromFile}.`,
      );
    }

    const supplierDocRefToUpdate = doc(db, "suppliers", supplierIdFromFile);
    const supplierSnapToUpdate = await supplierDocRefToUpdate.get();
    if (supplierSnapToUpdate.exists()) {
      const supplierData = supplierSnapToUpdate.data();
      const priceFiles = supplierData.priceFiles || [];
      const updatedPriceFiles = priceFiles.map((pf) => {
        if (pf.storagePath === filePath) {
          return {
            ...pf,
            processingStatus: "processed",
            lastProcessed: Timestamp.now(),
            articlesFound: articlesToProcess.length,
            articlesAdded: articlesAddedCount,
            articlesUpdated: articlesUpdatedCount,
          };
        }
        return pf;
      });
      await supplierDocRefToUpdate.update({priceFiles: updatedPriceFiles});
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    const errorSupplierDocRef = doc(db, "suppliers", supplierIdFromFile);
    try {
      const errorSupplierSnap = await errorSupplierDocRef.get();
      if (errorSupplierSnap.exists()) {
        const supplierData = errorSupplierSnap.data();
        const priceFiles = supplierData.priceFiles || [];
        const updatedPriceFiles = priceFiles.map((pf) => {
          if (pf.storagePath === filePath) {
            return {
              ...pf,
              processingStatus: "error",
              lastProcessed: Timestamp.now(),
              errorDetails: error.message,
            };
          }
          return pf;
        });
        await errorSupplierDocRef.update({priceFiles: updatedPriceFiles});
      }
    } catch (statusUpdateError) {
      console.error(
          "Failed to update error status for file:", statusUpdateError,
      );
    }
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`Temporary file ${tempFilePath} deleted.`);
    }
  }
  // */ // Remove end of block comment
  return null;
});

exports.fetchCompanyData = onRequest(
    {
      region: "europe-west1",
      cors: ["http://localhost:3000", "https://aio-arbetsorder.web.app"],
    },
    async (req, res) => {
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      const {orgNr} = req.body.data || req.body;

      if (!orgNr) {
        console.log("Organization number is required.");
        res.status(400).send({error: "Organization number is required."});
        return;
      }

      // Clean organization number (remove spaces and dashes)
      const cleanedOrgNr = orgNr.replace(/[\s-]/g, "");

      if (!/^\d{10}$/.test(cleanedOrgNr)) {
        console.log("Invalid organization number format:", orgNr);
        res.status(400).send({
          error: "Invalid organization number format. Must be 10 digits.",
        });
        return;
      }

      try {
        // Scrape from Allabolag.se
        const url = `https://www.allabolag.se/${cleanedOrgNr}`;
        console.log(`Fetching company data from: ${url}`);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; AIO-Arbetsorder/1.0)",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
          },
        });

        if (!response.ok) {
          console.log(`Allabolag.se returned status: ${response.status}`);
          res.status(404).send({error: "Company not found."});
          return;
        }

        const html = await response.text();

        // Extract JSON data from __NEXT_DATA__ script tag
        const nextDataMatch = html.match(
            /<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/,
        );

        if (!nextDataMatch) {
          console.log("Could not find __NEXT_DATA__ in HTML");
          res.status(404).send({error: "Company not found."});
          return;
        }

        let companyInfo;
        try {
          const jsonData = JSON.parse(nextDataMatch[1]);
          companyInfo = jsonData.props?.pageProps?.company;

          if (!companyInfo || !companyInfo.name) {
            console.log("Could not find company data in JSON");
            res.status(404).send({error: "Company not found."});
            return;
          }
        } catch (parseError) {
          console.log("Error parsing JSON data:", parseError);
          res.status(404).send({error: "Company not found."});
          return;
        }

        // Extract address from company data
        const visitorAddr = companyInfo.visitorAddress ||
          companyInfo.legalVisitorAddress || {};

        const address = visitorAddr.addressLine || "";
        const zipCode = visitorAddr.zipCode || "";
        const postPlace = visitorAddr.postPlace || "";
        const zipCity = zipCode && postPlace ?
          `${zipCode} ${postPlace}` :
          (zipCode || postPlace);

        const companyData = {
          name: companyInfo.name,
          address: address,
          zipCity: zipCity,
          country: "Sverige",
        };

        console.log(
            `Successfully fetched company data for ${cleanedOrgNr}: ` +
            `${companyData.name}`,
        );
        res.status(200).send({data: companyData});
      } catch (error) {
        console.error("Error fetching company data:", error);
        res.status(500).send({
          error: "Failed to fetch company data: " + error.message,
        });
      }
    },
);

exports.inviteUser = onRequest(
    {
      region: "europe-west1",
      cors: ["http://localhost:3000", "https://aio-arbetsorder.web.app"],
    },
    async (req, res) => {
      if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
      }

      // TODO: Implementera robust autentisering/auktorisering här!
      // Kontrollera om den anropande användaren är en administratör.
      // Exempel:
      // const idToken = req.headers.authorization?.split('Bearer ')[1];
      // if (!idToken) {
      //   console.log("No ID token provided.");
      //   res.status(401).send({ error: "Unauthorized: No token." });
      //   return;
      // }
      // try {
      //   const decodedToken = await admin.auth().verifyIdToken(idToken);
      //   const adminUserDoc =
      //     await db.collection('users').doc(decodedToken.uid).get();
      //   if (!adminUserDoc.exists ||
      //       adminUserDoc.data().role !== 'admin') {
      //     console.log("User is not an admin:", decodedToken.uid);
      //     res.status(403).send({
      //       error: "Forbidden: User is not an admin.",
      //     });
      //     return;
      //   }
      //   console.log("Admin user verified:", decodedToken.uid);
      // } catch (error) {
      //   console.error("Error verifying token or admin role:", error);
      //   res.status(401).send({
      //     error: "Unauthorized: Invalid token or role check failed.",
      //   });
      //   return;
      // }

      // Hantera både anrop från callable och direkt HTTP
      const {email, role = "user"} = req.body.data || req.body;

      if (!email) {
        console.log("Email is required.");
        res.status(400).send({error: "Email is required."});
        return;
      }

      try {
        let userRecord;
        let userExistsInAuth = false;

        try {
          userRecord = await admin.auth().getUserByEmail(email);
          userExistsInAuth = true;
          console.log(
              `User ${email} already exists in Firebase Auth with ` +
              `UID: ${userRecord.uid}`,
          );
        } catch (error) {
          if (error.code === "auth/user-not-found") {
            console.log(
                `User ${email} not found in Firebase Auth. ` +
                `Creating new user.`,
            );
            userRecord = await admin.auth().createUser({
              email: email,
              emailVerified: false,
              // Du kan sätta ett slumpmässigt lösenord här om du vill,
              // men Firebase skickar vanligtvis ett e-postmeddelande för
              // kontoinställning.
              // password: "someRandomPassword",
              displayName: email.split("@")[0],
            });
            console.log(
                `Successfully created new user in Firebase Auth: ` +
                `${userRecord.uid} for email: ${email}`,
            );
          // Firebase Auth skickar vanligtvis ett e-postmeddelande för
          // att slutföra kontoinställningen.
          } else {
            throw error; // Andra Auth-fel
          }
        }

        // Kontrollera om användaren (baserat på UID) redan finns i
        // schedulableUsers
        const schedulableUsersRef = collection(db, "schedulableUsers");
        const q = query(
            schedulableUsersRef,
            where("uid", "==", userRecord.uid),
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          console.log(
              `User with UID ${userRecord.uid} already exists in ` +
              `schedulableUsers.`,
          );
          const existingDoc = querySnapshot.docs[0];
          if (existingDoc.data().role !== role) {
            await existingDoc.ref.update({
              role: role,
              email: userRecord.email,
            });
            console.log(
                `Updated role for existing schedulableUser ` +
                `${userRecord.uid} to ${role}.`,
            );
          }
          res.status(200).send({
            message: `User ${email} already exists and is configured. ` +
              `Role updated if different.`,
            uid: userRecord.uid,
            isNew: false,
          });
          return;
        }

        // Lägg till användaren i schedulableUsers
        const newUserInData = {
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName || email.split("@")[0],
          role: role,
          createdAt: Timestamp.now(),
        };

        const newUserDocRef =
          await addDoc(schedulableUsersRef, newUserInData);
        console.log(
            `User ${email} (UID: ${userRecord.uid}) added to ` +
            `schedulableUsers with ID: ${newUserDocRef.id}`,
        );

        res.status(201).send({
          message: `User ${email} has been ` +
            `${userExistsInAuth ? "configured" : "invited"}. ` +
            `They need to complete their account setup if new.`,
          uid: userRecord.uid,
          schedulableUserId: newUserDocRef.id,
          isNew: !userExistsInAuth,
        });
      } catch (error) {
        console.error("Error inviting user:", error);
        if (error.code === "auth/email-already-exists" && !error.uid) {
          res.status(409).send({
            error: `An account with email ${email} already exists ` +
              `but could not be fully processed. ` +
              `Please check Firebase Console.`,
          });
        } else if (error.code === "auth/email-already-exists") {
          res.status(409).send({
            error: `An account with email ${email} already exists. ` +
              `UID: ${error.uid}`,
          });
        } else {
          res.status(500).send({
            error: "Failed to invite user. " + error.message,
          });
        }
      }
    },
);
