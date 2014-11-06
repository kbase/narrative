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
    $where = "date >= '" . $from_date . "' and date <= '" . $to_date . "'";
    $qry = "select " . $groups_pre . "date,event,sum(dur) as 'total', count(*) as 'count' from narrative";
    $qry .= " where " . $where;
    if ($groups == "") {
        $qry .= " group by event,date";
    }
    else {
        $qry .= " group by " . $groups . ",event,date";
    }
    $qry .= " order by date,event";
    echo '<h2>Query</h2><p>' . $qry . '</p>';
    return $db->query($qry);
}
function total_by_day($rows) {
    $tbd = [];
    $i = 0;
    $rec = array();
    while ($row = $rows->fetchArray()) {
        if ($row['event'] == 'F') {
            /* create new record */
            $rec = array('date' => $row['date'],
                'meta' => array('generated' => 'whenever'),
                'methodCount' => $row['count'],
                'methodRunTime' => $row['total']);
        }
        elseif ($row['event'] == 'O') {
            /* add existing record to result */
            $rec['narrativeCount'] = $row['count'];
            $tbd[$i++] = $rec;
        }
    }
    return array('total_by_day' => $tbd);
}

// Show a table of data
echo '<table><tr><td>User</td><td>Method</td><td>Date</td><td>Total (sec)</td><td>Count</td></tr>';
$db = new SQLite3("logs.db");
$rows = agg($db, '2014-11-01', '2014-12-01');
echo json_encode(total_by_day($rows));
?>
</body>
</html>