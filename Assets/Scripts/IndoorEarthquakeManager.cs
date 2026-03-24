using UnityEngine;

public class IndoorEarthquakeManager : MonoBehaviour
{
    public ObjectShake[] shakeObjects;
    public Rigidbody[] fallingObjects;

    public float shakeDuration = 5f;

    void Start()
    {
        Invoke(nameof(StartEarthquake), 2f);
    }

    void StartEarthquake()
    {
        // Start rattling
        foreach (var obj in shakeObjects)
        {
            obj.StartShake();
        }

        // Drop objects after delay
        Invoke(nameof(DropObjects), 2f);

        // Stop shaking
        Invoke(nameof(StopEarthquake), shakeDuration);
    }

    void DropObjects()
    {
        foreach (var rb in fallingObjects)
        {
            rb.isKinematic = false;
        }
    }

    void StopEarthquake()
    {
        foreach (var obj in shakeObjects)
        {
            obj.StopShake();
        }
    }
}