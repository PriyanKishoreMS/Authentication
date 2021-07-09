let state = false;

const toggle = () => {
    if (state) {
        document.getElementById("password").setAttribute("type", "password");
        document.getElementById("eye").style.color = "#999";

        state = false;
    } else {
        document.getElementById("password").setAttribute("type", "text");
        document.getElementById("eye").style.color = "#111";

        state = true;
    }
}