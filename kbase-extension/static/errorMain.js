require(['./narrative_paths'], () => {
    'use strict';
    require([
        'jquery',
        'bluebird',
        'kb_common/jsonRpc/dynamicServiceClient',
        'narrativeConfig',
        'narrativeLogin',
    ], ($, Promise, DynamicServiceClient, Config, Login) => {
        Config.updateConfig()
            .then(() => {
                return Login.init($('#signin-button'), true);
            })
            .then(() => {
                const statusCode = document
                    .getElementById('error_container')
                    .getAttribute('data-code');
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
                const resultElem = document.getElementById('request-result');
                while (resultElem.firstChild) {
                    resultElem.removeChild(resultElem.firstChild);
                }
                const userId = Login.sessionInfo.user_id,
                    token = Login.sessionInfo.token,
                    reqLevel = document.getElementById('req-level').value,
                    wsId = Config.get('workspaceId'),
                    params = {
                        ws_id: wsId,
                        user: userId,
                        share_level: reqLevel,
                    },
                    narrativeService = new DynamicServiceClient({
                        module: 'NarrativeService',
                        url: Config.url('service_wizard'),
                        token: token,
                    });
                return narrativeService.callFunc('request_narrative_share', [params]);
            })
                .then(showSuccess)
                .catch((err) => {
                    showError(err);
                    toggleControls(true);
                })
                .finally(toggleLoader);
        }

        function toggleLoader(on) {
            const loader = document.getElementById('loader');
            if (on) {
                loader.style.display = 'inherit';
            } else {
                loader.style.display = 'none';
            }
        }

        function toggleControls(on) {
            const controls = document.getElementById('perm-request');
            if (on) {
                controls.style.display = 'inherit';
            } else {
                controls.style.display = 'none';
            }
        }

        function showError(err) {
            const msg = err.message ? err.message : err.originalError.name,
                errText = 'Sorry, an error occurred while processing your request: ' + msg,
                errElem = document.getElementById('request-result');
            errElem.append(errText);
        }

        function showSuccess() {
            const errElem = document.getElementById('request-result');
            errElem.append('Access request sent successfully!');
        }
    });
});
