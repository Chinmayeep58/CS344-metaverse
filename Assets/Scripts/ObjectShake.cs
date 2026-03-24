using UnityEngine;

public class ObjectShake : MonoBehaviour
{
    public float amplitude = 0.02f;
    public float frequency = 5f;

    private Vector3 startPos;
    private bool isShaking = false;

    void Start()
    {
        startPos = transform.localPosition;
    }

    public void StartShake()
    {
        isShaking = true;
    }

    public void StopShake()
    {
        isShaking = false;
        transform.localPosition = startPos;
    }

    void Update()
    {
        if (!isShaking) return;

        float x = Mathf.Sin(Time.time * frequency) * amplitude;
        float z = Mathf.Cos(Time.time * frequency) * amplitude;

        transform.localPosition = startPos + new Vector3(x, 0, z);
    }
}