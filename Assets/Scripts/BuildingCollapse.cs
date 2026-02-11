using UnityEngine;

public class BuildingCollapse : MonoBehaviour
{
    public GameObject intactModel;
    public GameObject fracturedModel;

    public float collapseShakeThreshold = 0.4f;
    public float collapseForce = 400f;
    public GameObject dustPrefab;

    private bool collapsed = false;
    private EarthquakeController quake;

    void Start()
    {
        quake = FindObjectOfType<EarthquakeController>();
        fracturedModel.SetActive(false);
    }

    void Update()
    {
        if (!collapsed && quake != null)
        {
            if (quake.CurrentShakeMagnitude() > collapseShakeThreshold)
            {
                Collapse();
            }
        }
    }

    // void Collapse()
    // {
    //     collapsed = true;

    //     intactModel.SetActive(false);
    //     fracturedModel.SetActive(true);

    //     Rigidbody[] pieces = fracturedModel.GetComponentsInChildren<Rigidbody>();

    //     foreach (Rigidbody rb in pieces)
    //     {
    //         rb.isKinematic = false;

    //         // Downward collapse (realistic)
    //         rb.AddForce(Vector3.down * collapseForce, ForceMode.Impulse);
    //     }
    // }

    // void Collapse()
    // {
    //     collapsed = true;

    //     intactModel.SetActive(false);
    //     fracturedModel.SetActive(true);

    //     Rigidbody[] pieces = fracturedModel.GetComponentsInChildren<Rigidbody>();

    //     foreach (Rigidbody rb in pieces)
    //     {
    //         rb.isKinematic = false;
    //     }
    // }

    void Collapse()
    {
        collapsed = true;

        intactModel.SetActive(false);
        fracturedModel.SetActive(true);

        // Spawn dust
        Instantiate(dustPrefab, transform.position, Quaternion.identity);

        Rigidbody[] pieces = fracturedModel.GetComponentsInChildren<Rigidbody>();

        foreach (Rigidbody rb in pieces)
        {
            rb.isKinematic = false;
        }
    }


}
