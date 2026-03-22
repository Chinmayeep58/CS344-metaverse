using UnityEngine;
using UnityEngine.Networking;
using TMPro;
using System.Collections;
using UnityEngine.SceneManagement;

[System.Serializable]
public class SessionData
{
    public string sessionId;
    public int studentId;
    public int teacherId;
    public string studentName;
    public string studentEmail;
}

[System.Serializable]
public class SessionResponse
{
    public bool success;
    public SessionData data;
}

public class FetchStudentAndStart : MonoBehaviour
{
    public TMP_Text nameText;
    public string nextSceneName;
    public float delay = 3f;

    void Start()
    {
        StartCoroutine(GetSession());
    }

    IEnumerator GetSession()
    {
        string url = "https://cs344-metaverse-1.onrender.com/api/students/session/active";

        UnityWebRequest www = UnityWebRequest.Get(url);

        yield return www.SendWebRequest();

        if (www.result == UnityWebRequest.Result.Success)
        {
            string json = www.downloadHandler.text;

            SessionResponse response = JsonUtility.FromJson<SessionResponse>(json);

            if (response.success && response.data != null)
            {
                string studentName = response.data.studentName;

                // Show on UI
                nameText.text = "Welcome, " + studentName;

                // Save for later use
                PlayerPrefs.SetString("SESSION_ID", response.data.sessionId);
                PlayerPrefs.SetString("STUDENT_NAME", studentName);

                // Move to next scene
                yield return new WaitForSeconds(delay);

                SceneManager.LoadScene(nextSceneName);
            }
        }
        else
        {
            Debug.Log("Error fetching session: " + www.error);
            nameText.text = "No active session found";
        }
    }
}