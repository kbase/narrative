<html>
<head>PHP test</head>
<body>
<?php
function total_by_user($db, $from_date, $to_date) {
    $where = "event = 'F' and date >= '" . $from_date . "' and date <= '" . $to_date . "'";
    $qry = "select user,date,sum(dur) as 'total', count(*) as 'count' from narrative where " . $where . " group by user";
    return $db->query($qry);
}
// Show a table of data
echo '<table><tr><td>User</td><td>Date</td><td>Total (sec)</td><td>Count</td></tr>';
$db = new SQLite3("logs.db");
$rows = total_by_user($db, '2014-10-01', '2014-11-01');
while ($row = $rows->fetchArray()) {
    echo '<tr><td>' . $row['user'] . '</td><td>' . $row['date'] . '</td><td>' . $row['total'] . '</td><td>' . $row['count'] . '</td></tr>';
}
 echo '</table>';
?>
</body>
</html>