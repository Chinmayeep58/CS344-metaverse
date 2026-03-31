using UnityEngine;

public class EarthquakeManager : MonoBehaviour
{
    public float amplitude = 0.1f;
    public float frequency = 5f;

    private Vector3 startPos;

    void Start()
    {
        startPos = transform.position;
    }

    void Update()
    {
        float x = Mathf.Sin(Time.time * frequency) * amplitude;
        float z = Mathf.Cos(Time.time * frequency) * amplitude;

        transform.position = startPos + new Vector3(x, 0, z);
    }

    public float CurrentShakeMagnitude()
    {
        return amplitude;
    }
}