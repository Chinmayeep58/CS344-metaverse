using UnityEngine;

public class CameraShake : MonoBehaviour
{
    public float amplitude = 0.2f;
    public float frequency = 2f;
    public float duration = 5f;

    private Vector3 startPos;
    private float timeElapsed;
    private bool shaking = false;

    public void StartShake()
    {
        startPos = transform.localPosition;
        timeElapsed = 0f;
        shaking = true;
    }

    void Update()
    {
        if (!shaking) return;

        if (timeElapsed < duration)
        {
            float x = Mathf.Sin(Time.time * frequency) * amplitude;
            float z = Mathf.Sin(Time.time * frequency * 1.2f) * amplitude;

            transform.localPosition = startPos + new Vector3(x, 0, z);
            timeElapsed += Time.deltaTime;
        }
        else
        {
            shaking = false;
            transform.localPosition = startPos;
        }
    }
}