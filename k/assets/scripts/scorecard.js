var ScoreCard = function(config) {
    
    if(!config) {
        config = {
            autoProjects : false
        };
    }
    
    var self = this;
    var resultId = null;
    
    // my guess is binaryString is XLS and arrayBuffer is XLSX
    var rABS = true; // true: readAsBinaryString ; false: readAsArrayBuffer
    
    // use as dictionaries
    var students = {};
    var assignments = {};

    // my logger
    var log = function(msg, obj) {
        var debug = true;
        if(debug) {
            console.log('\n');
            if(typeof obj === 'object') console.log(msg, JSON.stringify(obj));
            else if(obj) console.log(msg, obj);
            else console.log(msg);
        }
    };
    
    // get names and make student objects
    var mineStudents = function(worksheet, column) {
        if(worksheet[column] && worksheet[column].v) {
            worksheet[column].v.split('\n').forEach(function(ele) {
                log ('what is ele = ', ele);
                students[ele] = {
                    name : ele,
                    assignments : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                };
            });  
        }
    };
    
    // alph sort by name
    var compareStudentNames = function(a,b) {
        if (a.name < b.name)
            return -1;
        if (a.name > b.name)
            return 1;
        return 0;
    }
    
    // convert students dictionary to sorted students array
    var studentsToArray = function() {
        var a = [];
        for (var key in students) {
            if (students.hasOwnProperty(key) && key !== 'toSortedArray') {
                log('student has key = ', key);
                if(students[key] !== null) {
                    log('pushing student = ', students[key]);
                    a.push(students[key]);
                }
            }
        }
        return a.sort(compareStudentNames);
    };
    
    // clear the data and the gui
    var reset = function() {
        students = {};
        document.getElementById(resultId).innerHTML = '';
    }
    
    // where the magic happens
    // an excel file landed
    // students are graded here
    var receiveDrop = function(e) {
        reset();
        e.stopPropagation();
        e.preventDefault();
        var files = e.dataTransfer.files, f = files[0];
        var reader = new FileReader();
        reader.onload = function (e) {
            var data = e.target.result;
            if (!rABS) data = new Uint8Array(data); // wha?
            
            var workbook = XLSX.read(data, { type: rABS ? 'binary' : 'array' });
            var worksheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[worksheetName];

            // sets student dictionary from names spread across three columns
            mineStudents(worksheet, 'B2');
            mineStudents(worksheet, 'C2');
            mineStudents(worksheet, 'D2');
            
            // sets scores on the student dictionary
            function setCompletions(completionStatus) {
                if(completionStatus && completionStatus.v) {
                    completionStatus.v.split('\n').forEach(function(ele) {
                        var unit = assignments[assignmentName];
                        students[ele].assignments[unit-1]++;
                    });
                }                
            }

            // todo: make this dynamic
            const START = 3; // What is Programming?
            const STOP = 96; // Project: Bookshelf
            for(var i = START; i <= STOP; i++) {
                var assignmentName = worksheet['A' + i].v;
                var completionStatus = worksheet['D' + i];
                
                // auto award every student their project score
                if(config && config.autoProjects) {
                    if(assignmentName.indexOf('Project:') !== -1) {
                        setCompletions(worksheet['B' + i]);
                        setCompletions(worksheet['C' + i]);
                    }
                }
                // always score completes anyway
                setCompletions(worksheet['D' + i]);
            }
            
            log('after parsing, students = ', students);

            writeScores(studentsToArray());
        };
        if (rABS) reader.readAsBinaryString(f);
        else reader.readAsArrayBuffer(f);
    }
    
    // filters assignments by unit number
    var getPossible = function(index) {
        // https://stackoverflow.com/a/37615234/1161948
        var filtered = Object.keys(assignments).reduce(function (filtered, key) {
            if (assignments[key] === index)
                filtered[key] = assignments[key];
            return filtered;
        }, {});
        return Object.keys(filtered).length;
    }
    
    // update gui
    var writeScores = function(studentArray) {
        log('student array = ', studentArray);
        if(studentArray.length > 0) {
            var head = '<tr><th>Student Name</th>';
            for(var i = 0; i < studentArray[0].assignments.length; i++) {
                head += '<th><div>HW' + (i+1) + '</div><div>/' + getPossible(i+1) + '</div></th>';
            }
            head += '</tr>';

            var body = '';
            studentArray.forEach(function(student) {
                var row = '<tr><td id="student-name">' + student.name + '</td>'
                var scores = student.assignments;
                scores.forEach(function(score) {
                    row += '<td>' + score + '</td>'
                });
                row += '</tr>';
                body += row;
            });

            var table = '<table id="scorecard-students-table">';
            table += head;
            table += body;
            table += '</table>';

            document.getElementById(resultId).innerHTML = table;
        }
    }
    
    // hard coded to load units, names from data/assignments.tsv
    self.loadAssignments = function(file) {
        $.get(file, function (data) {
            log('parsing data = ', data);
            var lines = data.split('\n');
            var count = 0;
            lines.forEach(function (line) {
                if (line.length > 0) {
                    count++;
                    var columns = line.trim().split('\t');
                    var unit = columns[0];
                    var name = columns[1];
                    assignments[name] = parseInt(unit);
                }
            });
            assignments.count = count;
            log('loaded assignments = ', assignments);
        });
    };
    
    // attach file drop handler
    self.handleDrops = function(elementId) {
        document.getElementById(elementId).addEventListener('drop', receiveDrop, false);
    };
    
    // write the gui
    self.writeTo = function(elementId) {
        resultId = elementId;
    };
    
    self.autoProjects = function(torf) {
        config.autoProjects = torf;
    }
}