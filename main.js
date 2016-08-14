/* FOLDER DROP - view-source:http://protonet.github.io/plupload/examples/drag_and_drop.html */
/* ZIP - https://stuk.github.io/jszip/documentation/howto/read_zip.html */

var editor;
var editorFontSize = 14;
var numFiles = 0;
var numFilesProcessed = 0;
var collection = [];
var windex = 0; // used by arrow keys to set the current index

// call this every time new files are uploaded
var reset = function() {
    collection = [];
    numFiles = 0;
    numFilesProcessed = 0;
    windex = 0;
};

// checks if the user's web browser supports all necessary apis
var verifyFileAPISupport = function() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      // Great success! All the File APIs are supported.
    } else {
        $('#support-message').show();
        $('#support-message').text('The File APIs are not fully supported in this browser.');
    }    
};

// process a single file
var processFile = function(event, file) {
    var f = {
      code : event.target.result,
      name : file.name
    };
    var a = f.name.split(".");
    if(a.length === 1 || ( a[0] === "" && a.length === 2 ) ) {
        // ignore the file, it has no extension
    } else if (a.pop() === 'pde') {
        collection.push(f);        
    } else {
        console.log('not a PDE - ');
        console.log('file.name = ' + f.name);
    }
    numFilesProcessed++;
    
    // we're done processing files - load the first one
    if(numFilesProcessed === numFiles) {
        console.log(collection);
        pimp(0);
    }
};

// process all the dropped files
var processFiles = function(files) {
    numFiles = files.length;
    for(var i = 0; i < files.length; i++) {
        var f = files[i];
        var reader = new FileReader();
        reader.onloadend = (function(file) {
            return function(event) {
                processFile(event, file);
            };
        })(f);
        reader.readAsText(f);
    }
};

// fires when file(s) dropped
var onFilesSelected = function(event) {
    reset();
    var files = event.target.files; // FileList object
    processFiles(files);
};

// register file drop change
var registerHandlers = function() {
    document.getElementById('files').addEventListener('change', onFilesSelected, false);
};

// set the editor code
var setEditorCode = function(code) {
    editor.getSession().setValue(code);
};

// update canvas and editor with new code
var setNewSketch = function(code) {
    Processing.getInstanceById('sketch').exit();
    var container = $('#canvas-container');
    var canvas = document.createElement('canvas');
    canvas.id = 'sketch';
    container.html('');
    container.append(canvas);
    new Processing(canvas, code);
};

// called by keydown - flips through sketches and code
var pimp = function(index) {
    var f = collection[index];
    $('#file-name').text(index + ": " + f.name);
    try {
        $('.pjsconsole .console').html('boom');
        setNewSketch(f.code);
        $('#error-message').text('');
    } catch(err) {
        $('#error-message').text(err);
    }
    setEditorCode(f.code);
};

$(document).keydown(function(e){
    // left arrow
    if ((e.keyCode || e.which) == 37 && windex > 0) {   
        windex--;
        pimp(windex);
    }
    // right arrow
    if ((e.keyCode || e.which) == 39 && windex < collection.length - 1) {
        windex++;
        pimp(windex);
    }   
});

$(document).ready(function() {
    verifyFileAPISupport();
    registerHandlers();
    
    var initcode = $('#processing-code').text();
    editor = ace.edit("editor");
    editor.$blockScrolling = Infinity;
    editor.setTheme("ace/theme/monokai");
    editor.setFontSize(editorFontSize);
    editor.getSession().setMode("ace/mode/java");
    
    setEditorCode(initcode);
    
    // run the editor's code
    $('#run').click(function() {
        var code = editor.getSession().getValue();
        try {
            setNewSketch(code);
            $('#error-message').text('');
        } catch(err) {
            $('#error-message').text(err);
        }
    });
    
    // increase editor font size
    $('#fontup').click(function() {
        editor.setFontSize(++editorFontSize);
        $('#fontSize').text(editorFontSize);
    });
    
    // decrease editor font size
    $('#fontdown').click(function() {
        editor.setFontSize(--editorFontSize);
        $('#fontSize').text(editorFontSize);
    });
    
    // display the font size
    $('#fontSize').text(editorFontSize);
});