import { IslandTerrain } from './IslandTerrain.js';
import { RoadNetwork } from './RoadNetwork.js';
import { CityBuilder } from './CityBuilder.js';
import { NatureBuilder } from './NatureBuilder.js';
import { PropsBuilder } from './PropsBuilder.js';
import { SkyEnvironment } from './SkyEnvironment.js';

export class World {
  constructor(scene, assetGen) {
    this.scene = scene;
    this.assetGen = assetGen;

    this.terrain = new IslandTerrain(scene, assetGen);
    this.roads = new RoadNetwork(scene, assetGen, this.terrain);
    this.city = new CityBuilder(scene, assetGen, this.terrain);
    this.nature = new NatureBuilder(scene, assetGen, this.terrain);
    this.props = new PropsBuilder(scene, assetGen, this.terrain, this.roads);
    this.sky = new SkyEnvironment(scene);
  }

  getGroundElevation(x, z) {
    const roadElev = this.roads.getBridgeElevation(x, z);
    if (roadElev !== null) {
      return roadElev;
    }
    return this.terrain.getElevation(x, z);
  }

  checkCollision(pos, radius = 0.8) {
    if (this.city.checkCollision(pos, radius)) return true;
    if (this.roads.checkCollision(pos, radius)) return true;
    return false;
  }

  getCurrentDistrict(x, z) {
    return this.city.getDistrictName(x, z);
  }

  cycleTimeOfDay() {
    return this.sky.cycleTime();
  }

  update(delta, time) {
    this.terrain.update(delta, time);
    this.roads.update(delta);
    this.sky.update(delta, time);
  }
}
