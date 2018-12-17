/**
 * SAMPLE DATA:
 * https://docs.google.com/spreadsheets/d/1VRsJnpSmTZMa1m4xyPw5Q7UDr7iWkxipaOArwp9758g/edit?usp=sharing
 * 
 * TODO:
 * - make units dynamic, even for more than one khan section
 *   - idea: user should be able to drop their own units.tsv (or json?)
 */

var grader = new ScoreCard();
grader.loadAssignments('assets/data/assignments.tsv');
grader.handleDrops('files');
grader.writeTo('result');

$('#result').on('click', '#scorecard-students-table tr th, #scorecard-students-table tr td', function () {
    $('*').removeClass('selected');
    $(this).addClass('selected');
    var columnNo = $(this).index();
    $(this).closest("table").find("tr td:nth-child(" + (columnNo + 1) + ")").addClass('selected');
});