using UnityEngine;
using TMPro;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text;

public class SendCompletionToBackend : MonoBehaviour
{
    public TMP_Text statusText;
    public float delayBeforeSend = 5f;

    private string url = "https://cs344-metaverse-1.onrender.com/api/students/update-score";

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
            client.Timeout = System.TimeSpan.FromSeconds(10);

            // 👤 Student ID (REQUIRED)
            int studentId = PlayerPrefs.GetInt("STUDENT_ID", 0);
            if (studentId == 0)
            {
                statusText.text = "Invalid student ID!";
                return;
            }

            string json = "{\"student_id\":" + studentId + ",\"exam_score\":100}";
            StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

            HttpResponseMessage response = await client.PostAsync(url, content);

            string responseText = await response.Content.ReadAsStringAsync();
            Debug.Log("Response: " + responseText);

            if (response.IsSuccessStatusCode)
            {
                statusText.text = "Course Completed! 🎉";

                if (responseText.Contains("\"issued\":true"))
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
            statusText.text = "Error: " + e.Message;
        }
    }
}