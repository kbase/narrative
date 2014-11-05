<html>
<head>PHP test</head>
<body>
<?php
function agg($db, $from_date, $to_date, $group1, $group2) {
    $groups = "";
    $groups_pre = "";
    if ($group1 !== null) {
        $groups .= $group1;
        if ($group2 !== null) {
            $groups .= "," . $group2;
        }
        $groups_pre = $groups . ",";
    }
    $where = "event = 'F' and date >= '" . $from_date . "' and date <= '" . $to_date . "'";
    $qry = "select " . $groups_pre . "date,sum(dur) as 'total', count(*) as 'count' from narrative";
    $qry .= " where " . $where;
    if ($groups != "") {
        $qry .= " group by " . $groups;
    }
    echo '<h2>Query</h2><p>' . $qry . '</p>';
    return $db->query($qry);
}
// Show a table of data
echo '<table><tr><td>User</td><td>Method</td><td>Date</td><td>Total (sec)</td><td>Count</td></tr>';
$db = new SQLite3("logs.db");
$rows = agg($db, '2014-10-01', '2014-11-01', 'name', 'user');
while ($row = $rows->fetchArray()) {
    echo '<tr><td>' . $row['user'] . '</td><td>' . $row['name'] . '</td><td>' . $row['date'] . '</td><td>' . $row['total'] . '</td><td>' . $row['count'] . '</td></tr>';
}
 echo '</table>';
?>
</body>
</html>