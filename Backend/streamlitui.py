import streamlit as st
import requests

API_BASE = "http://127.0.0.1:8000"

st.set_page_config(page_title="Nexlas AI - Test Console", layout="centered")
st.title("Nexlas AI — Backend Test Console")
st.caption("Internal testing UI only. Not the real frontend.")

# Keep state across reruns
if "user_id" not in st.session_state:
    st.session_state.user_id = None
if "current_question" not in st.session_state:
    st.session_state.current_question = None

tabs = st.tabs(["1. Auth", "2. Diagnostic", "3. Recommendation", "4. Roadmap"])

# ---------------- TAB 1: AUTH ----------------
with tabs[0]:
    st.subheader("Register")
    with st.form("register_form"):
        r_name = st.text_input("Name", key="r_name")
        r_email = st.text_input("Email", key="r_email")
        r_password = st.text_input("Password", type="password", key="r_password")
        register_submit = st.form_submit_button("Register")

    if register_submit:
        resp = requests.post(f"{API_BASE}/auth/register", json={
            "name": r_name, "email": r_email, "password": r_password
        })
        if resp.status_code == 200:
            st.success(f"Registered! User ID: {resp.json()['id']}")
            st.session_state.user_id = resp.json()["id"]
        else:
            st.error(f"{resp.status_code}: {resp.text}")

    st.divider()
    st.subheader("Login")
    with st.form("login_form"):
        l_email = st.text_input("Email", key="l_email")
        l_password = st.text_input("Password", type="password", key="l_password")
        login_submit = st.form_submit_button("Login")

    if login_submit:
        resp = requests.post(f"{API_BASE}/auth/login", json={
            "email": l_email, "password": l_password
        })
        if resp.status_code == 200:
            st.success(f"Logged in! User ID: {resp.json()['id']}")
            st.session_state.user_id = resp.json()["id"]
        else:
            st.error(f"{resp.status_code}: {resp.text}")

    st.divider()
    manual_id = st.number_input("Or manually set user_id for testing", min_value=1, step=1, value=st.session_state.user_id or 1)
    if st.button("Use this user_id"):
        st.session_state.user_id = manual_id
        st.success(f"Active user_id set to {manual_id}")

    if st.session_state.user_id:
        st.info(f"Active user_id: {st.session_state.user_id}")


# ---------------- TAB 2: DIAGNOSTIC ----------------
with tabs[1]:
    if not st.session_state.user_id:
        st.warning("Set a user_id in the Auth tab first.")
    else:
        if st.button("Get next question"):
            resp = requests.get(f"{API_BASE}/chat/next/{st.session_state.user_id}")
            if resp.status_code == 200:
                st.session_state.current_question = resp.json()
            else:
                st.error(f"{resp.status_code}: {resp.text}")

        q = st.session_state.current_question
        if q:
            st.write(f"**Diagnostic status:** {q['diagnostic_status']}")

            if q["next_question"] is None:
                st.success("Diagnostic complete! Go to the Recommendation tab.")
            else:
                nq = q["next_question"]
                st.write(f"**Question:** {nq['question']}")

                answer = None
                if nq["type"] == "single_select":
                    answer = st.radio("Choose one:", nq["options"], key=f"ans_{nq['id']}")
                elif nq["type"] == "multi_select":
                    answer = st.multiselect("Choose one or more:", nq["options"], key=f"ans_{nq['id']}")
                elif nq["type"] == "text":
                    answer = st.text_input("Your answer:", key=f"ans_{nq['id']}")

                if st.button("Submit answer"):
                    resp = requests.post(f"{API_BASE}/chat/answer", json={
                        "user_id": st.session_state.user_id,
                        "answers": [{"question_id": nq["id"], "answer": answer}]
                    })
                    if resp.status_code == 200:
                        st.session_state.current_question = resp.json()
                        st.rerun()
                    else:
                        st.error(f"{resp.status_code}: {resp.text}")


# ---------------- TAB 3: RECOMMENDATION ----------------
with tabs[2]:
    if not st.session_state.user_id:
        st.warning("Set a user_id in the Auth tab first.")
    else:
        if st.button("Get recommendation"):
            resp = requests.get(f"{API_BASE}/recommendations/{st.session_state.user_id}")
            if resp.status_code == 200:
                data = resp.json()
                st.subheader(f"Career: {data['career_title']} ({data['fit_score']}% fit)")

                st.write("**Skill Gaps**")
                for g in data["skill_gaps"]:
                    st.progress(min(g["current_level"], 1.0), text=f"{g['skill']} — gap: {g['gap']}")

                st.write("**Recommended Courses**")
                for c in data["recommended_courses"]:
                    st.write(f"- {c['title']} ({c['difficulty']}) — covers {c['skill_covered']}")

                st.write("**Recommended Mentor**")
                m = data["recommended_mentor"]
                st.write(f"{m['name']} — {m['specialization']}")
                st.write(m["bio"])
                st.write(f"📧 {m['email']}")
            else:
                st.error(f"{resp.status_code}: {resp.text}")


# ---------------- TAB 4: ROADMAP ----------------
with tabs[3]:
    if not st.session_state.user_id:
        st.warning("Set a user_id in the Auth tab first.")
    else:
        if st.button("Get / generate roadmap"):
            resp = requests.get(f"{API_BASE}/roadmap/{st.session_state.user_id}")
            if resp.status_code == 200:
                data = resp.json()
                st.subheader(f"Roadmap: {data['career_recommendation']} ({data['fit_score']}% fit)")

                steps = data["roadmap_steps"]
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.write("**Month 1**")
                    for item in steps["month1"]:
                        st.write(f"- {item}")
                with col2:
                    st.write("**Month 2**")
                    for item in steps["month2"]:
                        st.write(f"- {item}")
                with col3:
                    st.write("**Month 3**")
                    for item in steps["month3"]:
                        st.write(f"- {item}")

                st.write("**Next action**")
                st.info(data["next_action"])
            else:
                st.error(f"{resp.status_code}: {resp.text}")