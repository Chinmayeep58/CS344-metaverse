using UnityEngine;
using TMPro;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text;

public class SendCompletionToBackend : MonoBehaviour
{
    public TMP_Text statusText;
    public float delayBeforeSend = 5f;

    private string url = "https://cs344-metaverse-1.onrender.com/api/students/update-score/session";

    async void Start()
    {
        await Task.Delay((int)(delayBeforeSend * 1000));
        await SendScore();
    }

    async Task SendScore()
    {
        statusText.text = "Submitting result...";

        try
        {
            HttpClientHandler handler = new HttpClientHandler();
            handler.ServerCertificateCustomValidationCallback =
                (msg, cert, chain, errors) => true;

            HttpClient client = new HttpClient(handler);

            int studentId = PlayerPrefs.GetInt("STUDENT_ID", 0);
            string sessionId = PlayerPrefs.GetString("SESSION_ID", "");

            if (studentId == 0 || string.IsNullOrEmpty(sessionId))
            {
                statusText.text = "Missing session data!";
                return;
            }

            string json = "{\"student_id\":" + studentId +
                          ",\"exam_score\":100," +
                          "\"session_id\":\"" + sessionId + "\"}";

            StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

            HttpResponseMessage response = await client.PostAsync(url, content);
            string responseText = await response.Content.ReadAsStringAsync();

            Debug.Log("Score Response: " + responseText);

            if (response.IsSuccessStatusCode)
            {
                // ✅ Backend handles certificate automatically
                statusText.text = "Course Completed 🎉";

                // Optional: check backend response
                if (responseText.Contains("certificate") || responseText.Contains("issued"))
                {
                    statusText.text = "Certificate Generated 🎓";
                }
            }
            else
            {
                statusText.text = "Failed: " + response.StatusCode;
            }
        }
        catch (System.Exception e)
        {
            Debug.Log("ERROR: " + e.ToString());
            statusText.text = e.Message;
        }
    }
}