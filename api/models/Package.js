/**
 * Package.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var _ = require('lodash');
var Promise = require('bluebird');

module.exports = {

  attributes: {
    name: {
      type: Sequelize.STRING,
      unique: true,
      primaryKey: true,
      allowNull: false
    }

  },
  associations: function() {
    Package.hasMany(PackageVersion,
      {
        as: 'versions',
        foreignKey: {
          name: 'package_name',
          as: 'versions'
        }
      }
    );
    Package.belongsTo(PackageVersion, {
      as: 'latest_version',
      foreignKey: {
        name:'latest_version_id',
        as: 'latest_version'
      },
      constraints: false }
    );

    Package.belongsTo(Repository, {
      as: 'repository',
      foreignKey: {
        name:'type_id',
        allowNull: true,
        as: 'repository'
      }
    });

    Package.belongsToMany(TaskView, {
      as: 'inViews',
      foreignKey: 'package_name',
      through: 'TaskViewPackages',
      timestamps: false
    });

    Package.belongsToMany(PackageVersion, { as: 'reverse_dependencies', foreignKey: 'dependency_name', through: Dependency, constraints: false});

    Package.hasOne(DownloadStatistic,
      {
        as: 'last_month_stats',
        foreignKey: {
          name: 'package_name',
          as: 'last_month_stats'
        }
      }
    );

    Package.hasMany(Star,
      {
        as: 'stars',
        foreignKey: 'package_name'
      }
    );
  },

  options: {
    getterMethods: {
      api_uri: function()  {
        return '/api/packages/:name'
          .replace(':name', encodeURIComponent(this.getDataValue('name')));
      },
      uri: function()  {
        return '/packages/:name'
          .replace(':name', encodeURIComponent(this.getDataValue('name')));
      }
    },
    underscored: true,

    classMethods: {
      getLatestVersionNumber :function(package_name){
        return Package.findOne({
          include:[{
            model:PackageVersion,
            as:'latest_version',
            attributes:['version'],
            required:true
          }],
          where:{
            name:package_name
          }
        });
      },

      getAllNamesOfType:function(type){
        return Package.findAll({
          where:{type_id:type}
        }).then(function(packages){
          return _.map(packages,function(_package){
            return _package.dataValues.name;
          })
        })
      },

      getPackagePercentile: function(name, percentilesArray) {
        return sails.controllers.packageversion._getDownloadStatistics(undefined, name)
        .then(function(downloads) {
          var total = downloads.total;

          var percentiles = _.mapValues(_.keyBy(percentilesArray,"percentile"),function(a){return a.value;});
          var percentile = _.findLastKey(percentiles, function(p) {
            return total >= p;
          });
          return {total: total, percentile: Math.round(percentile * 100) / 100 };
        });


      }
    }
  }
};

