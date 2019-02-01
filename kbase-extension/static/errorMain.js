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
            return Login.init($('#signin-button'));
        })
        .then(function () {
            let statusCode = document.getElementsByClassName('error')[0].getAttribute('data-code');
            if (statusCode === 403) {
                buildRequestControl();
            }
        });

    function buildRequestControl() {
        $('#req-btn').click(requestPermission);
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
            $('#request-result').empty();
            let userId = Login.sessionInfo.user_id,
                token = Login.sessionInfo.token,
                reqLevel = $('#req-level').val(),
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
        if (on) {
            $('#loader').show();
        } else {
            $('#loader').hide();
        }
    }

    function toggleControls(on) {
        if (on) {
            $('#perm-request').show();
        } else {
            $('#perm-request').hide();
        }
    }

    function showError(err) {
        let msg = err.message ? err.message : err.originalError.name;
        let errText = 'Sorry, an error occurred while processing your request: ' + msg;
        $('#request-result').append(errText);
    }

    function showSuccess() {
        $('#request-result').append('Access request sent successfully!')
    }
});
});
