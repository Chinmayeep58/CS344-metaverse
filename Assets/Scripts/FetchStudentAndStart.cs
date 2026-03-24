// // using UnityEngine;
// // using UnityEngine.Networking;
// // using TMPro;
// // using System.Collections;
// // using UnityEngine.SceneManagement;

// // [System.Serializable]
// // public class SessionData
// // {
// //     public string sessionId;
// //     public int studentId;
// //     public int teacherId;
// //     public string studentName;
// //     public string studentEmail;
// // }

// // [System.Serializable]
// // public class SessionResponse
// // {
// //     public bool success;
// //     public SessionData data;
// // }

// // public class FetchStudentAndStart : MonoBehaviour
// // {
// //     public TMP_Text nameText;
// //     public string nextSceneName;
// //     public float delay = 3f;

// //     void Start()
// //     {
// //         StartCoroutine(GetSession());
// //     }

// //     IEnumerator GetSession()
// //     {
// //         string url = "https://cs344-metaverse-1.onrender.com/api/students/session/active";

// //         UnityWebRequest www = UnityWebRequest.Get(url);

// //         yield return www.SendWebRequest();

// //         if (www.result == UnityWebRequest.Result.Success)
// //         {
// //             string json = www.downloadHandler.text;

// //             SessionResponse response = JsonUtility.FromJson<SessionResponse>(json);

// //             if (response.success && response.data != null)
// //             {
// //                 string studentName = response.data.studentName;

// //                 // Show on UI
// //                 nameText.text = "Welcome, " + studentName;

// //                 // Save for later use
// //                 PlayerPrefs.SetString("SESSION_ID", response.data.sessionId);
// //                 PlayerPrefs.SetString("STUDENT_NAME", studentName);

// //                 // Move to next scene
// //                 yield return new WaitForSeconds(delay);

// //                 SceneManager.LoadScene(nextSceneName);
// //             }
// //         }
// //         else
// //         {
// //             Debug.Log("Error fetching session: " + www.error);
// //             nameText.text = "No active session found";
// //         }
// //     }
// // }



// using UnityEngine;
// using UnityEngine.Networking;
// using TMPro;
// using System.Collections;
// using UnityEngine.SceneManagement;

// public class FetchStudentAndStart : MonoBehaviour
// {
//     public TMP_Text nameText;
//     public string nextSceneName;
//     public float delay = 3f;

//     void Start()
//     {
//         StartCoroutine(GetSession());
//     }

//     IEnumerator GetSession()
//     {
//         string url = "https://cs344-metaverse-1.onrender.com/api/students/session/active";

//         Debug.Log("Calling API: " + url);

//         UnityWebRequest www = UnityWebRequest.Get(url);

//         yield return www.SendWebRequest();

//         Debug.Log("RESULT: " + www.result);
//         Debug.Log("ERROR: " + www.error);

//         string json = www.downloadHandler.text;
//         Debug.Log("RAW JSON: " + json);

//         if (www.result == UnityWebRequest.Result.Success)
//         {
//             // 🔥 MANUAL PARSE (SAFE WAY)
//             if (json.Contains("studentName"))
//             {
//                 string name = ExtractValue(json, "studentName");
//                 nameText.text = "Welcome, " + name;

//                 PlayerPrefs.SetString("STUDENT_NAME", name);

//                 yield return new WaitForSeconds(delay);
//                 SceneManager.LoadScene(nextSceneName);
//             }
//             else
//             {
//                 nameText.text = "Parsing failed";
//             }
//         }
//         else
//         {
//             nameText.text = "API Error";
//         }
//     }

//     // 🔥 SIMPLE STRING PARSER (FOR DEBUG)
//     string ExtractValue(string json, string key)
//     {
//         string search = "\"" + key + "\":\"";
//         int start = json.IndexOf(search);

//         if (start == -1) return "Not Found";

//         start += search.Length;
//         int end = json.IndexOf("\"", start);

//         return json.Substring(start, end - start);
//     }
// }



// using UnityEngine;
// using UnityEngine.Networking;
// using TMPro;
// using System.Collections;
// using UnityEngine.SceneManagement;

// public class FetchStudentAndStart : MonoBehaviour
// {
//     public TMP_Text nameText;
//     public string nextSceneName;
//     public float delay = 3f;

//     void Start()
//     {
//         StartCoroutine(GetSession());
//     }

//     IEnumerator GetSession()
//     {
//         string url = "https://cs344-metaverse-1.onrender.com/api/students/session/active";

//         UnityWebRequest www = UnityWebRequest.Get(url);

//         yield return www.SendWebRequest();

//         Debug.Log("RESULT: " + www.result);
//         Debug.Log("ERROR: " + www.error);
//         Debug.Log("RAW: " + www.downloadHandler.text);

//         if (www.result != UnityWebRequest.Result.Success)
//         {
//             nameText.text = "NETWORK ERROR";
//             yield break;
//         }

//         string json = www.downloadHandler.text;

//         // 🔥 SIMPLE STRING PARSE (WORKS ALWAYS)
//         if (json.Contains("\"success\":true"))
//         {
//             string name = ExtractValue(json, "studentName");

//             nameText.text = "Welcome, " + name;

//             PlayerPrefs.SetString("STUDENT_NAME", name);

//             yield return new WaitForSeconds(delay);

//             SceneManager.LoadScene(nextSceneName);
//         }
//         else
//         {
//             nameText.text = "No active session";
//         }
//     }

//     string ExtractValue(string json, string key)
//     {
//         string search = "\"" + key + "\":\"";
//         int start = json.IndexOf(search);

//         if (start == -1) return "Not Found";

//         start += search.Length;
//         int end = json.IndexOf("\"", start);

//         return json.Substring(start, end - start);
//     }
// }



using UnityEngine;
using TMPro;
using System.Collections;
using UnityEngine.SceneManagement;
using System.Net.Http;
using System.Threading.Tasks;
using System.Net;
using System.Net.Security;

public class FetchStudentAndStart : MonoBehaviour
{
    public TMP_Text nameText;
    public string nextSceneName;
    public float delay = 3f;

    private string url = "https://cs344-metaverse-1.onrender.com/api/students/session/active";

    async void Start()
    {
        ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
        await GetSession();
    }

    async Task GetSession()
    {
        nameText.text = "Connecting...";

        try
        {
            HttpClientHandler handler = new HttpClientHandler();
            handler.ServerCertificateCustomValidationCallback =
                (message, cert, chain, errors) => true;

            HttpClient client = new HttpClient(handler);
            client.Timeout = System.TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0");

            HttpResponseMessage response = await client.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                nameText.text = "Server Error: " + response.StatusCode;
                return;
            }

            string json = await response.Content.ReadAsStringAsync();
            Debug.Log("Response: " + json);

            if (json.Contains("\"success\":true"))
            {
                // ✅ Extract values
                string name = ExtractValue(json, "studentName");
                string studentIdStr = ExtractValue(json, "studentId");

                int studentId = 0;
                int.TryParse(studentIdStr, out studentId);

                // ✅ Store values (IMPORTANT)
                PlayerPrefs.SetString("STUDENT_NAME", name);
                PlayerPrefs.SetInt("STUDENT_ID", studentId);

                // (Optional but good)
                PlayerPrefs.Save();

                nameText.text = "Welcome, " + name;

                Debug.Log("Stored STUDENT_ID: " + studentId);

                await Task.Delay((int)(delay * 1000));

                SceneManager.LoadScene(nextSceneName);
            }
            else
            {
                nameText.text = "No active session";
            }
        }
        catch (System.Exception e)
        {
            Debug.Log("FULL ERROR: " + e.ToString());
            nameText.text = e.Message;
        }
    }

    string ExtractValue(string json, string key)
    {
        // Handles both "studentId":123 and "studentName":"abc"
        string search = "\"" + key + "\":";
        int start = json.IndexOf(search);

        if (start == -1) return "0";

        start += search.Length;

        // If value is string
        if (json[start] == '\"')
        {
            start++;
            int end = json.IndexOf("\"", start);
            return json.Substring(start, end - start);
        }
        else
        {
            int end = json.IndexOf(",", start);
            if (end == -1) end = json.IndexOf("}", start);

            return json.Substring(start, end - start).Trim();
        }
    }
}