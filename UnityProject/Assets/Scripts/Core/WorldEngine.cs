using System;
using System.Collections.Generic;
using UnityEngine;

namespace WorldBoxClone.Core
{
    public class WorldEngine : MonoBehaviour
    {
        public static WorldEngine Instance;

        [Header("Simulation Settings")]
        public Vector2Int worldSize = new Vector2Int(100, 100);
        public float tickRate = 0.5f;

        public Biome[,] Grid;
        public List<Agent> Agents = new List<Agent>();
        public List<City> Cities = new List<City>();

        private void Awake()
        {
            Instance = this;
        }

        private void Start()
        {
            GenerateWorld();
            InvokeRepeating("StepSimulation", 1.0f, tickRate);
        }

        void GenerateWorld()
        {
            Grid = new Biome[worldSize.x, worldSize.y];
            for (int y = 0; y < worldSize.y; y++)
            {
                for (int x = 0; x < worldSize.x; x++)
                {
                    float noise = Mathf.PerlinNoise(x * 0.1f, y * 0.1f);
                    if (noise < 0.3f) Grid[x, y] = Biome.Water;
                    else if (noise < 0.4f) Grid[x, y] = Biome.Sand;
                    else if (noise < 0.7f) Grid[x, y] = Biome.Grass;
                    else Grid[x, y] = Biome.Mountain;
                }
            }
        }

        void StepSimulation()
        {
            foreach (var city in Cities)
            {
                UpdateCity(city);
            }
        }

        void UpdateCity(City city)
        {
            city.stats.age += 1;

            // Resource Gathering Logic
            for (int dy = -3; dy <= 3; dy++)
            {
                for (int dx = -3; dx <= 3; dx++)
                {
                    Vector2Int pos = city.position + new Vector2Int(dx, dy);
                    if (pos.x >= 0 && pos.x < worldSize.x && pos.y >= 0 && pos.y < worldSize.y)
                    {
                        Biome b = Grid[pos.x, pos.y];
                        if (UnityEngine.Random.value < 0.02f)
                        {
                            if (b == Biome.Grass) city.resources.wheat += 1;
                            if (b == Biome.Mountain) city.resources.stone += 1;
                            if (b == Biome.Forest) city.resources.wood += 1;
                            city.resources.meat += 0.2f;
                        }
                    }
                }
            }

            // Production
            if (city.resources.wheat >= 5)
            {
                city.resources.wheat -= 5;
                city.resources.bread += 1;
            }

            // Tech & Era Progression
            CheckProgression(city);
        }

        void CheckProgression(City city)
        {
            // Implementation of level-up logic
            float nextLevelWealth = 100 * Mathf.Pow(2, city.level - 1);
            if (city.wealth >= nextLevelWealth)
            {
                city.level++;
                city.wealth -= nextLevelWealth * 0.5f;
                // Update Era...
            }
        }

        public static string GenerateName(SpeciesType species)
        {
            string[] names = species switch
            {
                SpeciesType.Humans => new[] { "Mysh", "Iva", "Aldrin" },
                SpeciesType.Orcs => new[] { "Grom", "Throk", "Mok" },
                _ => new[] { "Unknown" }
            };
            return names[UnityEngine.Random.Range(0, names.Length)];
        }
    }

    [Serializable]
    public class Agent
    {
        public string id;
        public SpeciesType species;
        public Vector2 position;
        public bool alive = true;
        public string cityId;
    }
}
