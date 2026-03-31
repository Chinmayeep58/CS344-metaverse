using UnityEngine;

public class CollapseOnStart : MonoBehaviour
{
    public GameObject intactModel;
    public GameObject fracturedModel;

    public float delay = 0.5f;

    void Start()
    {
        fracturedModel.SetActive(false);
        Invoke(nameof(Collapse), delay);
    }

    void Collapse()
    {
        intactModel.SetActive(false);
        fracturedModel.SetActive(true);

        fracturedModel.transform.parent = null;

        Rigidbody[] pieces = fracturedModel.GetComponentsInChildren<Rigidbody>();
        Collider[] colliders = fracturedModel.GetComponentsInChildren<Collider>();

        // 🔥 STEP 1: Disable internal collisions (MOST IMPORTANT)
        for (int i = 0; i < colliders.Length; i++)
        {
            for (int j = i + 1; j < colliders.Length; j++)
            {
                Physics.IgnoreCollision(colliders[i], colliders[j]);
            }
        }

        // 🔥 STEP 2: Activate physics safely
        foreach (Rigidbody rb in pieces)
        {
            rb.isKinematic = false;
            rb.useGravity = true;

            // Reset motion
            rb.velocity = Vector3.zero;
            rb.angularVelocity = Vector3.zero;

            // 🔥 Add damping (CRITICAL)
            rb.drag = 4f;
            rb.angularDrag = 4f;

            // 🔥 NO random explosion force
        }
    }
}