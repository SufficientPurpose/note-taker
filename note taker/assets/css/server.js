// Dependencies
// =============================================================
const express = require("express");
const fs = require("fs");
const path = require("path");
const util = require("util");
const app = express();
const crypto = require("crypto");

// Declare the port to use
var PORT = process.env.PORT || 8080;

// Set the static route to serve public files
app.use(express.static(__dirname + '/public'));

// Promisify the fs.readFile method
var readFileAsync = util.promisify(fs.readFile);

// Function to read the notes in the db.json file
function readNotes(){
    return readFileAsync(__dirname + "/db/db.json", "utf8");
};

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set the route to serve the notes.html file to the client
app.get("/notes", function(req, res) {
    res.sendFile(path.join(__dirname, "/public/notes.html"));
});

// Set the route to get notes from the db.json file and return to the client
app.get("/api/notes", async function(req, res) {
    var notes = [];
    await readNotes()
    .then(function(res){
        notes = JSON.parse(res);
        return notes;
    })
    .catch(err => err ? console.error(err) : console.log("Successful!"));
    res.json(notes);
});

// Set the route to serve the index.html file to the client
app.get("*", function(req, res) {
    res.sendFile(path.join(__dirname, "/public/index.html"));
});

// Set the route for the client to post a new note and save it to the db.json file
app.post("/api/notes", async function(req, res) {
    var newNote = req.body;
    await readNotes()
    .then(function(res){
        notes = JSON.parse(res);
        var newNoteID = crypto.randomBytes(8).toString("hex");
        // Check to see if any saved note has the same id as the one generated for the new note
        // and generate a new id for the new note if any note has that id
        for (i = 0; i < notes.length; i++){
            if (notes[i].id === newNoteID){
                newNoteID = crypto.randomBytes(8).toString("hex");
            }
        }
        newNote.id = newNoteID;
        notes.push(newNote);
        data = JSON.stringify(notes, null, 2);
        fs.writeFile(__dirname + "/db/db.json", data, err => err ? console.error(err) : console.log("New note added successfully!"));
    })
    .catch(err => err ? console.error(err) : console.log("Post Successful!"));
    res.json(newNote);
});

// Set the route for the client to delete a note from the db.json file
app.delete("/api/notes/:id", async function(req, res) {
    var noteID = req.params.id;
    await readNotes()
    .then(function(res){
    notes = JSON.parse(res);
    // find noteID in notes
    for(i = 0; i < notes.length; i++){
        if (notes[i].id === noteID){
            var noteIndex = i;
        }
    }
    // delete noteID
    notes.splice(noteIndex, 1);
    // write notes to db.json
    data = JSON.stringify(notes, null, 2);
    fs.writeFile(__dirname + "/db/db.json", data, err => err ? console.error(err) : console.log("Note Deleted!"));
    })
    .catch(err => err ? console.error(err) : console.log("Get Note to Delete Successful!"));
    res.json(notes)
});

// Start the server listening on the port
app.listen(PORT, function() {
    console.log("App listening on PORT " + PORT);
});