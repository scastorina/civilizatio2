using System;
using UnityEngine;

namespace WorldBoxClone.Core
{
    [Serializable]
    public class CityResources
    {
        public float wheat;
        public float stone;
        public float iron;
        public float gold;
        public float bread;
        public float wood;
        public float meat;
    }

    [Serializable]
    public class CityStats
    {
        public int births;
        public int deaths;
        public float age;
        public int infected;
        public string leader;
        public string culture;
        public string kingdom;
    }

    [Serializable]
    public class City
    {
        public string id;
        public string name;
        public SpeciesType species;
        public Vector2Int position;
        public int population;
        public float wealth;
        public float tradeVolume;
        public int techLevel;
        public int level;
        public Era era;
        public CityResources resources = new CityResources();
        public CityStats stats = new CityStats();
    }
}
