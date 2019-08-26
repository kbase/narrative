import biokbase.narrative.clients as clients

def build_report_view_data(result):
    """
    Returns a structure like this:
    {
        links: []
        objects: [{
            'upa': '...',
            'name': 'foo',
            'type': '...',
            'description': '...'
        }]
        summary: '',
        report: ''
    }
    """
    if not result or not result[0].get('report_name') or not result[0].get('report_ref'):
        return {}
    report_ref = result[0].get('report_ref')
    ws = clients.get('workspace')
    report = ws.get_objects2({'objects': [{'ref': report_ref}]})['data'][0]['data']
    """{'direct_html': None,
     'direct_html_link_index': None,
     'file_links': [],
     'html_links': [],
     'html_window_height': None,
     'objects_created': [{'description': 'Annotated genome', 'ref': '43666/6/1'}],
     'summary_window_height': None,
     'text_message': 'Genome saved to: wjriehl:narrative_1564507007662/some_genome\nNumber of genes predicted: 3895\nNumber of protein coding genes: 3895\nNumber of genes with non-hypothetical function: 2411\nNumber of genes with EC-number: 1413\nNumber of genes with Seed Subsystem Ontology: 1081\nAverage protein length: 864 aa.\n',
     'warnings': []}
    """
    created_objs = []
    if report.get('objects_created'):
        report_objs_created = report['objects_created']
        # make list to look up obj types with get_object_info3
        info_lookup = [{"ref": o["ref"]} for o in report_objs_created]
        infos = ws.get_object_info3({'objects': info_lookup})['infos']
        for idx, info in enumerate(infos):
            created_objs.append({
                'upa': report_objs_created[idx]['ref'],
                'description': report_objs_created[idx].get('description', ''),
                'name': info[1],
                'type': info[2].split('-')[0].split('.')[-1]
            })
    html = {}
    if report.get('direct_html'):
        html['direct'] = report.get('direct_html')

    if report.get('html_links'):
        idx = report.get('direct_html_link_index', 0)
        if idx < 0 or idx >= len(report['html_links']):
            idx = 0
        html['links'] = report['html_links']
        html['paths'] = []
        for idx, link in enumerate(html['links']):
            html['paths'].append(f'/api/v1/{report_ref}/$/{idx}/{link["name"]}')
        html['link_idx'] = idx

    return {
        'objects': created_objs,
        'summary': report.get('text_message', ''),
        'html': html
    }
