using UnityEngine;

public class EarthquakeController : MonoBehaviour
{
    public float amplitude = 0.5f;
    public float frequency = 2f;
    public float duration = 10f;

    private Vector3 startPos;
    private float timeElapsed;

    void Start()
    {
        startPos = transform.position;
    }

    void FixedUpdate()
    {
        if (timeElapsed < duration)
        {
            float x = Mathf.Sin(Time.time * frequency) * amplitude;
            float z = Mathf.Sin(Time.time * frequency * 1.2f) * amplitude;

            transform.position = startPos + new Vector3(x, 0, z);
            timeElapsed += Time.fixedDeltaTime;
        }
    }

    public float CurrentShakeMagnitude()
    {
        return amplitude;
    }

}
