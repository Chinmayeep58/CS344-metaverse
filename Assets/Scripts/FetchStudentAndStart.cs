using UnityEngine;
using TMPro;
using System.Net.Http;
using System.Threading.Tasks;
using UnityEngine.SceneManagement;

public class FetchSessionAndStart : MonoBehaviour
{
    public TMP_Text statusText;
    public string nextSceneName;

    private string url = "https://cs344-metaverse-1.onrender.com/api/students/session/active";

    async void Start()
    {
        await GetSession();
    }

    async Task GetSession()
    {
        statusText.text = "Connecting...";

        try
        {
            HttpClientHandler handler = new HttpClientHandler();
            handler.ServerCertificateCustomValidationCallback =
                (msg, cert, chain, errors) => true;

            HttpClient client = new HttpClient(handler);

            HttpResponseMessage response = await client.GetAsync(url);
            string responseText = await response.Content.ReadAsStringAsync();

            Debug.Log("Session Response: " + responseText);

            if (response.IsSuccessStatusCode && responseText.Contains("\"success\":true"))
            {
                // ✅ Extract values from "data"
                string studentId = ExtractValue(responseText, "studentId");
                string sessionId = ExtractValue(responseText, "sessionId");
                string studentName = ExtractValue(responseText, "studentName");

                // ✅ Store values
                PlayerPrefs.SetInt("STUDENT_ID", int.Parse(studentId));
                PlayerPrefs.SetString("SESSION_ID", sessionId);
                PlayerPrefs.SetString("STUDENT_NAME", studentName);
                PlayerPrefs.Save();

                // Step 1
                statusText.text = "Connected Successfully";

                await Task.Delay(2000);

                // Step 2
                statusText.text = "Welcome, " + studentName;

                await Task.Delay(2000);

                // Step 3 → Next Scene
                SceneManager.LoadScene(nextSceneName);
            }
            else
            {
                statusText.text = "No Active Session Found";
            }
        }
        catch (System.Exception e)
        {
            Debug.Log("ERROR: " + e.ToString());
            statusText.text = e.Message;
        }
    }

    string ExtractValue(string json, string key)
    {
        string search = "\"" + key + "\":";
        int start = json.IndexOf(search);
        if (start == -1) return "";

        start += search.Length;

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