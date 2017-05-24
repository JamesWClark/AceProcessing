/* FOLDER DROP - view-source:http://protonet.github.io/plupload/examples/drag_and_drop.html */
/* ZIP - https://stuk.github.io/jszip/documentation/howto/read_zip.html */

// ZipObject API
// https://stuk.github.io/jszip/documentation/api_zipobject.html

var editor;
var editorFontSize = 14;
var numFiles = 0;
var numFilesProcessed = 0;
var collection = []; // the files collection, whether zip or otherwise
var windex = 0; // used by arrow keys to set the current index
var requireZip = true; // depends on state of the checkbox #cb-require-zip
var consoleRelocated = false; // by default, the logger will not be relocated in the dom

// logger that prevents circular object reference in javascript
var log = function(msg, obj) {
    console.log('\n');
    if(obj) {
        try {
            console.log(msg + JSON.stringify(obj));
        } catch(err) {
            var simpleObject = {};
            for (var prop in obj ){
                if (!obj.hasOwnProperty(prop)){
                    continue;
                }
                if (typeof(obj[prop]) == 'object'){
                    continue;
                }
                if (typeof(obj[prop]) == 'function'){
                    continue;
                }
                simpleObject[prop] = obj[prop];
            }
            console.log('circular-' + msg + JSON.stringify(simpleObject)); // returns cleaned up JSON
        }        
    } else {
        console.log(msg);
    }
};

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
      // Great! Success! All the File APIs are supported.
    } else {
        $('#support-message').show();
        $('#support-message').text('The File APIs are not fully supported in this browser.');
    }
};

// checks if all the files are finished processing
var continueUnzip = function() {
    numFilesProcessed++;
    
    // we're done processing files - load the first one
    if(numFilesProcessed === numFiles && collection.length > 0) {
        pimp(0);
    }
};

var continueOneZip = function(codeBall, count, length) {
    
    // done processing one codeball
    if(count === length) {
        collection.push(codeBall);
    }

    // done processing all the files and decompressing all the zips
    if(count === length && numFilesProcessed === numFiles) {
        pimp(0);
    }
};

var decompressAndExtractCode = function(file) {
    var compressed = new JSZip();
    var codeBall = {
        name : file.name,
        code : [],
        paths : []
    };
    compressed.loadAsync(file).then(function(contents) {
        var contentLength = Object.keys(contents.files).length;
        var numCodeBallsProcessed = 0;
        // contents is an array of compressed files
        contents.forEach(function(path, zipObject) {
            
            var isFolder = zipObject.dir;
            
            if(isFolder) {
                ++numCodeBallsProcessed;
            } else {
                compressed.file(path).async('string').then(function(text) {
                    // repeating some code now - this is an internal validation of the zip file
                    // only add PDE for now
                    // TODO: fix #2 #3 and #4 here
                    var n = path.split('/').pop(); // name
                    var c = text; // file contents
                    var a = path.split('/').pop().split('.'); // parts split by periods
                    codeBall.paths.push(path);

                    // has extension
                    if(a.length > 1) {
                        var ext = a.pop();
                        switch(ext) {
                            case 'pde':
                                codeBall.code.push(c);
                                break;
                            default:
                                break;
                        }
                    }
                    continueOneZip(codeBall, ++numCodeBallsProcessed, contentLength);
                });
            }
        });
    }, function() { // error handler
        log('zip error?')
    });
    continueUnzip();
}

// process a single file
var processFile = function(event, file) {
    // split filename into array parts for extension detection
    var a = file.name.split('.');
    
    // if the filename has an extension
    if (a.length > 1) {
        var ext = a.pop(); // the extension is the last element of the array
        switch(ext) {
            case 'pde':
                if(!requireZip) {
                    collection.push({
                        name : file.name,
                        code : [ event.target.result ],
                        paths : [ file.name ]
                    });
                    continueUnzip();
                }
                break;
            case 'zip':
                decompressAndExtractCode(file);
                break;
            default:
                numFilesProcessed++;
                log('not a valid file format. should be .pde or .zip where file.name = ', file.name);
                break;
        }
    } else {
        numFilesProcessed++;
        log('not a valid file');
    }
};

// process all the dropped files
var processFiles = function(files) {
    requireZip = $('#cb-require-zip').prop('checked');
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
    if(numFiles > 1) {
        $('#sketch-previous, #sketch-next').show();
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
    if(Processing.getInstanceById('sketch')) {
        Processing.getInstanceById('sketch').exit();
    }
    var container = $('#canvas-container');
    var canvas = document.createElement('canvas');
    canvas.id = 'sketch';
    container.html('');
    container.append(canvas);

    try {
        new Processing(canvas, code);
    } catch (err) {
        $('#error-message').html(err);
    }
};

// called by keydown or button click - flips through sketches and code
var pimp = function(index) {
    var f = collection[index];
    $('#file-name-header').text(index + ": " + f.name);
    $('#file-name-zip-header').text(f.name);
    $('#error-message').text('');

    var code = '';
    for (var i = 0; i < f.code.length; i++) {
        code += f.code[i] + '\n\n\n';
    }
    
    setNewSketch(code);
    setEditorCode(code);
    
    if (f.paths) {
        $('#files-list-container').show(); 
        var filesList = $('#files-list');
        filesList.html('');
        f.paths.forEach(function(path) {
            filesList.append('<div>' + path + '</div>');
        });
    }
    if (windex > 0) {
        $('#sketch-previous').prop('disabled', false);
    } else if (windex < collection.length - 1) {
        $('#sketch-next').prop('disabled', false);
    } else if (windex === 0) {
        $('#sketch-previous').prop('disabled', true);
    } else if (windex === collection.length - 1) {
        $('#sketch-next').prop('disabled', true);
    }
};

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
    
    // flip left
    $('#sketch-previous').click(function() {
        if(windex > 0) {
            windex--;
            pimp(windex);
        }
    });
    
    // flip right
    $('#sketch-next').click(function() {
        if(windex < collection.length - 1) {
            windex++;
            pimp(windex);
        }
    });
    
    // flip through projects
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
        // prevent arrow key scrolling page
        if([33,34,35,36,37,38,39,40].indexOf(e.which) !== -1) {
              e.preventDefault();
              return false;
        }
        return true;
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
    
    // watch for the pjcsonole to appear in dom; move it
    $(document).on('DOMNodeInserted', function(e) {
        if(!consoleRelocated && e.target.className.indexOf('pjsconsole') > -1) {
            consoleRelocated = true;
            $('.pjsconsole').appendTo('#console-container');
        }
    });
    
    // show or hide cursor based on checkbox
    $('#cb-show-cursor').change(function() {
        if(this.checked) {
            $('#sketch').addClass('cursor-none');
        } else {
            $('#sketch').removeClass('cursor-none');
        }
    });
    
    // prevent default drag and gives visual indicator
    $(document).on('dragover dragenter', function(e) {
        $('*').addClass('see-through');
        e.preventDefault();
        e.stopPropagation();
    });
    
    // repair styles after dragleave
    $(document).on('dragleave', function() {
        $('*').removeClass('see-through');
    });
    
    // file drop anywhere on page
    $(document).on('drop', function(e){
        $('*').removeClass('see-through');
        if(e.originalEvent.dataTransfer){
            if(e.originalEvent.dataTransfer.files.length) {
                e.preventDefault();
                e.stopPropagation();
                reset();
                processFiles(e.originalEvent.dataTransfer.files);
            }   
        }
    });
    
    // prepends or modifies the size() function and resizes the canvas accordingly 
    $.fn.extend({
        resizeCanvas: function(w, h) {
            var canvas = $(this)[0];
            var code = editor.getValue();
            var sizePattern = /(\bsize) *[(] *\d* *, *\d* *[)] *;/g;
            var newSize = 'size(' + w + ',' + h + ');'
            var match = sizePattern.exec(code);
                
            // code contains size() command
            if(match) {
                code = code.replace(sizePattern, newSize);
            } else {
                code = newSize + '\n' + code;    
            }
            
            canvas.width  = w;
            canvas.height = h;
            setNewSketch(code);
            editor.setValue(code, -1);
        }
    });
    
    $('#re5x1').click(function() {
        $('#sketch').resizeCanvas(500, 100);
    });
    
    $('#re4x2').click(function() {
        $('#sketch').resizeCanvas(400, 200);
    });
    
    $('#re3x3').click(function() {
        $('#sketch').resizeCanvas(300, 300);
    });
    
    $('#re2x4').click(function() {
        $('#sketch').resizeCanvas(200, 400);
    });

    $('#re1x5').click(function() {
        $('#sketch').resizeCanvas(100, 500);
    });
    
    $('#re7x5').click(function() {
        $('#sketch').resizeCanvas(768, 500);
    });
    
    // allow typing 1 through 5 in the text editor, prevents resizing
    $(document).on('keydown', function(e) {
        // if it's not a text area, then resize (which re-runs the editor code);
        if(!$(':focus').is('textarea')) {
            var key = e.keyCode || e.which;
            switch(key) {
                case 49: //1
                    $('#sketch').resizeCanvas(500, 100);
                    break;
                case 50: //2
                    $('#sketch').resizeCanvas(400, 200);
                    break;
                case 51: //3
                    $('#sketch').resizeCanvas(300, 300);
                    break;
                case 52: //4
                    $('#sketch').resizeCanvas(200, 400);
                    break;
                case 53: //5
                    $('#sketch').resizeCanvas(100, 500);
                    break;
                case 54: //6
                    $('#sketch').resizeCanvas(768, 500);
                    break;
            }
        }
    });
});
