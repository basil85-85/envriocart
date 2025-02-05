// function onSignIn(googleUser) {
//     var profile = googleUser.getBasicProfile();
//     $("#name").text(profile.getName())
//     $("#email").text(profile.getEmail())
//     $("#image").attr("src",profile.getImageUrl());
//     $(".data").css("display","block");
//     $(".g-signin2").css("display","none")
//   }

//   function signOut() {
//     var auth2 = gapi.auth2.getAuthInstance();
//     auth2.signOut().then(function () {
//      alert("you have been signed out sucessfully");
//      $(".g-signin2").css("display","block")
//      $(".data").css("display","none");
//     });
//   }

// public/js/googlesignin.js
function onSignIn(googleUser) {
    const id_token = googleUser.getAuthResponse().id_token;
    console.log('Token:', id_token); 
    
    fetch('/auth/google', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: id_token })
    })
    .then(response => {
        console.log('Response:', response); // Debug log
        return response.json();
    })
    .then(data => {
        console.log('Data:', data); // Debug log
        if (data.success) {
            const profile = googleUser.getBasicProfile();
            $("#name").text(profile.getName());
            $("#email").text(profile.getEmail());
            $("#phone").text(profile.getPhone());
            $(".data").css("display", "block");
            $(".g-signin2").css("display", "none");
        }
    })
    .catch(error => {
        console.error('Auth Error:', error);
        alert('Authentication failed');
    });
}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        // Call backend to clear session
        fetch('/auth/signout', {
            method: 'POST'
        })
        .then(() => {
            alert("You have been signed out successfully");
            $(".g-signin2").css("display", "block");
            $(".data").css("display", "none");
        })
        .catch(error => {
            console.error('Error:', error);
        });
    });
}
window.onload = function () {
    google.accounts.id.initialize({
      client_id: '922178953334-6dbpoiajcqqshesvae72v5435igr37q7.apps.googleusercontent.com',
      callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
      document.getElementById('signInDiv'),
      { theme: 'outline', size: 'large' }
    );
    google.accounts.id.prompt(); // Optional: Displays the One Tap dialog
  };