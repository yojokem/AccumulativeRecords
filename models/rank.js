module.exports = (sequelize, DataTypes) => {
    const Rank = sequelize.define('rank', { // '직위도' 테이블
        rank: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        level: { // 직위도별 상하관계를 나타내는 척도이다.
            type: DataTypes.INTEGER,
            allowNull: false
        },
        unuse: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        timestamps: true,
        paranoid: true
    });

    Rank.associate = function (models) {
        models.rank.hasMany(models.position, {
            foreignKey: 'rank', sourceKey: 'rank', as: 'RankS'
        });
    };

    return Rank;
}

/**
 * Rank에는 아래와 같은 상하 직위도가 결정되어 있다.
 * 
 * admin - 사이트 관리 운영자
 * inteltasks - 정무청
 * investigator - 감사위원회
 * inspector - 대외교설부 감찰부
 * recorder - 기록물관리과
 * historian - 내정역사부
 */