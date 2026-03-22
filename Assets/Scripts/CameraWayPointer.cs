using UnityEngine;
using UnityEngine.SceneManagement;
using System.Collections;

public class CameraMoveRightOnly : MonoBehaviour
{
    public float moveDistance = 300f;   // 🔥 how much to move right
    public float moveSpeed = 3f;

    public float waitAtStart = 2f;
    public float waitAtEnd = 2f;

    public string nextSceneName;

    private float targetX;

    void Start()
    {
        // 🔥 calculate target based on CURRENT position
        targetX = transform.position.x + moveDistance;

        StartCoroutine(MoveRoutine());
    }

    IEnumerator MoveRoutine()
    {
        // ⏱ wait at start
        yield return new WaitForSeconds(waitAtStart);

        // 🔥 move ONLY in X
        while (transform.position.x < targetX)
        {
            float newX = Mathf.MoveTowards(
                transform.position.x,
                targetX,
                moveSpeed * Time.deltaTime
            );

            transform.position = new Vector3(
                newX,
                transform.position.y,
                transform.position.z
            );

            yield return null;
        }

        // 🎯 snap exactly
        transform.position = new Vector3(
            targetX,
            transform.position.y,
            transform.position.z
        );

        // ⏱ wait
        yield return new WaitForSeconds(waitAtEnd);

        SceneManager.LoadScene(nextSceneName);
    }
}