require([
    './narrative_paths',
], function () {
    'use strict';
    require([
        'jquery',
        'bluebird',
        'kb_common/jsonRpc/dynamicServiceClient',
        'narrativeConfig',
        'narrativeLogin',
        'css!font-awesome'
    ], function (
        $,
        Promise,
        DynamicServiceClient,
        Config,
        Login
    ) {
    Config.updateConfig()
        .then(function () {
            return Login.init($('#signin-button'), true);
        })
        .then(function () {
            let statusCode = document.getElementsByClassName('error')[0].getAttribute('data-code');
            if (statusCode === '403') {
                buildRequestControl();
            }
        });

    function buildRequestControl() {
        document.getElementById('req-btn').onclick = requestPermission;
    }

    function requestPermission() {
        /**
         * get token
         * get perm level request
         * get wsid
         * get ServiceWizard url
         * get user id
         * make call to NarrativeService.request_narrative_share({"ws_id": id, "user": the_user, "share_level": level})
         */
        toggleControls();
        toggleLoader(true);
        Promise.try(() => {
            let resultElem = document.getElementById('request-result');
            while (resultElem.firstChild) {
                resultElem.removeChild(resultElem.firstChild);
            }
            let userId = Login.sessionInfo.user_id,
                token = Login.sessionInfo.token,
                reqLevel = document.getElementById('req-level').value,
                wsId = Config.get('workspaceId'),
                params = {
                    'ws_id': wsId,
                    'user': userId,
                    'share_level': reqLevel
                },
                narrativeService = new DynamicServiceClient({
                    module: 'NarrativeService',
                    url: Config.url('service_wizard'),
                    token: token
                });
            return narrativeService.callFunc('request_narrative_share', [params]);
        })
            .then(showSuccess)
            .catch(err => {
                showError(err);
                toggleControls(true);
            })
            .finally(toggleLoader);
    }

    function toggleLoader(on) {
        let loader = document.getElementById('loader');
        if (on) {
            loader.style.display = 'inherit';
        } else {
            loader.style.display = 'none';
        }
    }

    function toggleControls(on) {
        let controls = document.getElementById('perm-request');
        if (on) {
            controls.style.display = 'inherit';
        } else {
            controls.style.display = 'none';
        }
    }

    function showError(err) {
        let msg = err.message ? err.message : err.originalError.name,
            errText = 'Sorry, an error occurred while processing your request: ' + msg,
            errElem = document.getElementById('request-result');
        errElem.append(errText);
    }

    function showSuccess() {
        let errElem = document.getElementById('request-result');
        errElem.append('Access request sent successfully!');
    }
});
});
