// using UnityEngine;
// using TMPro;
// using UnityEngine.SceneManagement;
// using System.Security.Cryptography;
// using System.Text;

// public class AuthManager : MonoBehaviour
// {
//     [Header("UI")]
//     public TMP_InputField emailInput;
//     public TMP_InputField passwordInput;
//     public TMP_Text messageText;

//     private const string EMAIL_KEY = "USER_EMAIL";
//     private const string PASSWORD_KEY = "USER_PASSWORD_HASH";

//     void Start()
//     {
//         messageText.text = "Hello";
//     }

//     // 🔘 SINGLE BUTTON ENTRY POINT
//     public void Submit()
//     {
//         if (!ValidateInput()) return;

//         if (!PlayerPrefs.HasKey(EMAIL_KEY))
//         {
//             // 🆕 New user
//             RegisterUser();
//         }
//         else
//         {
//             // 👤 Existing user
//             LoginUser();
//         }
//     }

//     void RegisterUser()
//     {
//         string passwordHash = HashPassword(passwordInput.text);

//         PlayerPrefs.SetString(EMAIL_KEY, emailInput.text);
//         PlayerPrefs.SetString(PASSWORD_KEY, passwordHash);
//         PlayerPrefs.Save();

//         messageText.text = "Welcome! Setting up your account...";
//         SceneManager.LoadScene("EQ_Scene1"); // or HomeScene
//     }

//     void LoginUser()
//     {
//         string storedEmail = PlayerPrefs.GetString(EMAIL_KEY);
//         string storedPasswordHash = PlayerPrefs.GetString(PASSWORD_KEY);

//         if (emailInput.text != storedEmail)
//         {
//             messageText.text = "Email not found";
//             return;
//         }

//         if (HashPassword(passwordInput.text) != storedPasswordHash)
//         {
//             messageText.text = "Incorrect password";
//             return;
//         }

//         messageText.text = "Welcome back!";
//         SceneManager.LoadScene("EQ_Scene1");
//     }

//     bool ValidateInput()
//     {
//         if (string.IsNullOrEmpty(emailInput.text) ||
//             string.IsNullOrEmpty(passwordInput.text))
//         {
//             messageText.text = "Email and password required";
//             return false;
//         }

//         if (!emailInput.text.Contains("@"))
//         {
//             messageText.text = "Invalid email format";
//             return false;
//         }

//         if (passwordInput.text.Length < 6)
//         {
//             messageText.text = "Password must be 6+ characters";
//             return false;
//         }

//         return true;
//     }

//     string HashPassword(string password)
//     {
//         using (SHA256 sha = SHA256.Create())
//         {
//             byte[] bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(password));
//             StringBuilder builder = new StringBuilder();

//             foreach (byte b in bytes)
//                 builder.Append(b.ToString("x2"));

//             return builder.ToString();
//         }
//     }
// }


using UnityEngine;
using TMPro;
using UnityEngine.SceneManagement;
using UnityEngine.Networking;
using System.Collections;
using System.Text;

public class StudentAuthManager : MonoBehaviour
{
    [Header("UI")]
    public TMP_InputField nameInput;
    public TMP_InputField emailInput;
    public TMP_InputField teacherCodeInput;
    public TMP_Text messageText;

    // ✅ FINAL CORRECT URL
    private string BASE_URL = "http://localhost:3000/api";

    public void Submit()
    {
        if (!ValidateInput()) return;

        StartCoroutine(JoinOrLogin());
    }

    // IEnumerator JoinOrLogin()
    // {
    //     string url = BASE_URL + "/students/join";

    //     Debug.Log("FINAL URL: " + url);

    //     JoinRequestData data = new JoinRequestData
    //     {
    //         name = nameInput.text.Trim(),
    //         email = emailInput.text.Trim(),
    //         teacher_code = teacherCodeInput.text.Trim()
    //     };

    //     string json = JsonUtility.ToJson(data);
    //     Debug.Log("JSON: " + json);

    //     // ✅ IMPORTANT FIX: use Post() instead of raw constructor
    //     UnityWebRequest request = UnityWebRequest.PostWwwForm(url, "");

    //     byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
    //     request.uploadHandler = new UploadHandlerRaw(bodyRaw);
    //     request.downloadHandler = new DownloadHandlerBuffer();

    //     request.SetRequestHeader("Content-Type", "application/json");

    //     yield return request.SendWebRequest();

    //     Debug.Log("Response Code: " + request.responseCode);
    //     Debug.Log("Response: " + request.downloadHandler.text);

    //     // ✅ SUCCESS (new student)
    //     if (request.responseCode == 200 || request.responseCode == 201)
    //     {
    //         try
    //         {
    //             JoinResponse response = JsonUtility.FromJson<JoinResponse>(request.downloadHandler.text);

    //             if (response != null && response.success)
    //             {
    //                 PlayerPrefs.SetInt("STUDENT_ID", response.student_id);
    //                 PlayerPrefs.SetInt("TEACHER_ID", response.teacher_id);
    //                 PlayerPrefs.SetString("TEACHER_WALLET", response.teacher_wallet);
    //                 PlayerPrefs.Save();
    //             }
    //         }
    //         catch
    //         {
    //             Debug.LogWarning("JSON parsing failed but continuing...");
    //         }

    //         messageText.text = "Account created!";

    //         yield return new WaitForSeconds(1f);

    //         Debug.Log("Loading scene...");
    //         SceneManager.LoadScene(2); // safer than name
    //     }

    //     // ⚠️ EXISTING USER (LOGIN)
    //     else if (request.responseCode == 409)
    //     {
    //         messageText.text = "Welcome back!";

    //         yield return new WaitForSeconds(1f);

    //         SceneManager.LoadScene(2);
    //     }

    //     // ❌ ERROR
    //     else
    //     {
    //         Debug.LogError("Error: " + request.error);

    //         messageText.text = "Error: " + request.responseCode;
    //     }
    // }

    IEnumerator JoinOrLogin()
{
    string url = "http://localhost:3000/api/students/join";

    Debug.Log("FINAL URL: " + url);

    // 🔥 Build JSON manually (avoids Unity serialization issues)
    string json = "{"
        + "\"name\":\"" + nameInput.text.Trim() + "\","
        + "\"email\":\"" + emailInput.text.Trim() + "\","
        + "\"teacher_code\":\"" + teacherCodeInput.text.Trim() + "\""
        + "}";

    Debug.Log("JSON: " + json);

    UnityWebRequest request = new UnityWebRequest(url, "POST");

    byte[] bodyRaw = Encoding.UTF8.GetBytes(json);
    request.uploadHandler = new UploadHandlerRaw(bodyRaw);
    request.downloadHandler = new DownloadHandlerBuffer();

    request.SetRequestHeader("Content-Type", "application/json");

    yield return request.SendWebRequest();

    Debug.Log("Response Code: " + request.responseCode);
    Debug.Log("Response: " + request.downloadHandler.text);

    // ✅ SUCCESS
    if (request.responseCode == 200 || request.responseCode == 201)
    {
        messageText.text = "Joined successfully!";

        yield return new WaitForSeconds(1f);

        SceneManager.LoadScene(2);
    }
    // ⚠️ USER EXISTS
    else if (request.responseCode == 409)
    {
        messageText.text = "Welcome back!";

        yield return new WaitForSeconds(1f);

        SceneManager.LoadScene(2);
    }
    else
    {
        messageText.text = "Error: " + request.responseCode;
    }
}
    
    bool ValidateInput()
    {
        if (string.IsNullOrEmpty(nameInput.text) ||
            string.IsNullOrEmpty(emailInput.text) ||
            string.IsNullOrEmpty(teacherCodeInput.text))
        {
            messageText.text = "All fields required";
            return false;
        }

        if (!emailInput.text.Contains("@"))
        {
            messageText.text = "Invalid email";
            return false;
        }

        if (teacherCodeInput.text.Length < 5)
        {
            messageText.text = "Invalid teacher code";
            return false;
        }

        return true;
    }
}

// 📦 REQUEST
[System.Serializable]
public class JoinRequestData
{
    public string name;
    public string email;
    public string teacher_code;
}

// 📦 RESPONSE
[System.Serializable]
public class JoinResponse
{
    public bool success;
    public string teacher_wallet;
    public int teacher_id;
    public int student_id;
}