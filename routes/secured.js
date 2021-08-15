const models = require('../models');

const redirectMessage = (res, msg, link) => res.send("<script type='text/javascript'>alert('" + msg + "'); location.href='" + link + "';</script>");

/**
 * 함수 precondition에 따라 success 또는 fail 콜백 함수를 호출한다. (자동 req, res 송부)
 * @param {*} req req object
 * @param {*} res res object
 * @param {*} precondition 전제 검증 함수(비동기 가능)
 * @param {*} successCallback 전제 검증 통과 시 콜백
 * @param {*} failCallback 전제 검증 통과 실패 시 콜백 (매개 변수가 함수로서 주어지지 않거나 없으면 자동 처리)
 */
module.exports = {
    preconditions: {
        /**
         * 기본 전제 검증 함수; User의 Position을 확인한다.
         * @param {*} req req object
         * @param {*} res res object
         * @param {*} options {rank: //, order: //, licensed: //} 의 형태로 주어져야 함.
         */
        position: async function (req, res, options) {
            let result = await models.position.findOne({
                where: options,
                attributes: ['licensed', 'createdAt']
            });

            if (result != null) {
                if (result.licensed == 1) return true;
            }

            return false;
        }
    },
    router: function (req, res, precondition, successCallback, failCallback) {
        if (precondition) {
            successCallback(req, res);
        } else {
            if (failCallback) {
                failCallback(req, res);
            } else {
                redirectMessage(res, "접근 권한이 없습니다.", "/");
            }
        }
    }
};