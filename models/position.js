module.exports = (sequelize, DataTypes) => {
    const Position = sequelize.define('position', { // '직급' 테이블
        rank: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 5 // 최하 등급은 5, 최상 등급은 0이다. 음수 구간은 미정 상태의 등급을 의미한다.
        },
        licensed: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0 // 0과 1로 구분할 건데 왜 Boolean이 아닌지 이해할 수 없으나 기존대로 한다.
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        timestamps: true,
        paranoid: true
    });

    Position.associate = function (models) {
        models.position.belongsTo(models.user, {
            foreignKey: 'user_id'
        });
        models.position.belongsTo(models.rank, {
            as: "RankS"
        })
    };

    return Position;
}

/**
 * Position에는 아래와 같은 상하 등급이 결정되어 있다.
 * 
 * admin - 사이트 관리 운영자
 * inteltasks - 정무청
 * investigator - 감사위원회
 * inspector - 대외교설부 감찰부
 * recorder - 기록물관리과
 * historian - 내정역사부
 */