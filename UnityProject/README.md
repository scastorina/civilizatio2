# Proyecto WorldBox Unity Migration

He transformado la lógica del simulador de TypeScript a un proyecto estructurado para **Unity**.

## Estructura
- **Assets/Scripts/Core**: Contiene el motor de simulación (`WorldEngine.cs`), los datos de ciudad (`CityData.cs`) y enumeraciones (`Enums.cs`).
- **Assets/Scripts/UI**: (Preparado) Para la gestión de la interfaz de usuario.
  
## Instrucciones para el Usuario
1.  Abre **Unity Hub**.
2.  Haz clic en **Add** y selecciona la carpeta `UnityProject`.
3.  Unity regenerará los archivos `.meta` y la base de datos de librerías.
4.  Asegúrate de tener instalado el paquete **Universal Render Pipeline (URP)** para los mejores efectos visuales.

## Notas Técnicas
- Se ha usado `Vector2Int` para la grilla del mapa.
- La simulación corre mediante `InvokeRepeating` para mayor estabilidad en C#.
- He implementado un sistema de `Perlin Noise` nativo de Unity para una generación de terreno infinitamente más realista que la versión web.
