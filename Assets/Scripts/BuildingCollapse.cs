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

    void Collapse()
    {
        collapsed = true;

        intactModel.SetActive(false);
        fracturedModel.SetActive(true);

        Rigidbody[] pieces = fracturedModel.GetComponentsInChildren<Rigidbody>();

        foreach (Rigidbody rb in pieces)
        {
            rb.isKinematic = false;

            // Downward collapse (realistic)
            rb.AddForce(Vector3.down * collapseForce, ForceMode.Impulse);
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
    //     }
    // }

    // void Collapse()
    // {
    //     collapsed = true;

    //     intactModel.SetActive(false);
    //     fracturedModel.SetActive(true);

    //     // Spawn dust
    //     Instantiate(dustPrefab, transform.position, Quaternion.identity);

    //     Rigidbody[] pieces = fracturedModel.GetComponentsInChildren<Rigidbody>();

    //     foreach (Rigidbody rb in pieces)
    //     {
    //         rb.isKinematic = false;
    //     }
    // }

}



// using UnityEngine;
// using System.Collections;
// using System.Collections.Generic;

// public class BuildingCollapse : MonoBehaviour
// {
//     public GameObject intactModel;
//     public GameObject fracturedModel;

//     public float collapseShakeThreshold = 0.4f;
//     public float delayBetweenLayers = 0.2f;
//     public float downwardForce = 5f;

//     public GameObject dustPrefab;

//     private bool collapsed = false;
//     private EarthquakeController quake;

//     void Start()
//     {
//         quake = FindObjectOfType<EarthquakeController>();
//         fracturedModel.SetActive(false);
//     }

//     void Update()
//     {
//         if (!collapsed && quake != null)
//         {
//             if (quake.CurrentShakeMagnitude() > collapseShakeThreshold)
//             {
//                 StartCoroutine(CollapseRoutine());
//             }
//         }
//     }

//     IEnumerator CollapseRoutine()
//     {
//         collapsed = true;

//         intactModel.SetActive(false);
//         fracturedModel.SetActive(true);

//         if (dustPrefab != null)
//         {
//             Instantiate(dustPrefab, transform.position, Quaternion.identity);
//         }

//         Rigidbody[] pieces = fracturedModel.GetComponentsInChildren<Rigidbody>();
//         Collider[] colliders = fracturedModel.GetComponentsInChildren<Collider>();

//         // 🔥 STEP 1: Ignore internal collisions (MOST IMPORTANT)
//         for (int i = 0; i < colliders.Length; i++)
//         {
//             for (int j = i + 1; j < colliders.Length; j++)
//             {
//                 Physics.IgnoreCollision(colliders[i], colliders[j]);
//             }
//         }

//         // 🔥 STEP 2: Group pieces by height (for realistic collapse)
//         Dictionary<int, List<Rigidbody>> layers = new Dictionary<int, List<Rigidbody>>();

//         foreach (Rigidbody rb in pieces)
//         {
//             int layer = Mathf.RoundToInt(rb.transform.position.y * 2f);

//             if (!layers.ContainsKey(layer))
//                 layers[layer] = new List<Rigidbody>();

//             layers[layer].Add(rb);

//             // Keep them frozen initially
//             rb.isKinematic = true;
//         }

//         // 🔥 STEP 3: Sort top → bottom
//         List<int> sortedLayers = new List<int>(layers.Keys);
//         sortedLayers.Sort((a, b) => b.CompareTo(a));

//         // 🔥 STEP 4: Collapse layer by layer
//         foreach (int layer in sortedLayers)
//         {
//             foreach (Rigidbody rb in layers[layer])
//             {
//                 rb.isKinematic = false;

//                 rb.velocity = Vector3.zero;
//                 rb.angularVelocity = Vector3.zero;

//                 // Damping (prevents flying)
//                 rb.drag = 2f;
//                 rb.angularDrag = 2f;

//                 // Freeze rotation initially (prevents explosion)
//                 rb.constraints = RigidbodyConstraints.FreezeRotation;

//                 // Small downward push
//                 rb.AddForce(Vector3.down * downwardForce, ForceMode.Impulse);

//                 // Release rotation after short delay
//                 StartCoroutine(ReleaseRotation(rb));
//             }

//             yield return new WaitForSeconds(delayBetweenLayers);
//         }
//     }

//     IEnumerator ReleaseRotation(Rigidbody rb)
//     {
//         yield return new WaitForSeconds(0.2f);

//         if (rb != null)
//         {
//             rb.constraints = RigidbodyConstraints.None;
//         }
//     }
// }