import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import java.lang.reflect.Method;
public class Test {
    public static void main(String[] args) {
        for (Method m : GetSignInWithGoogleOption.Builder.class.getMethods()) {
            System.out.println(m.getName());
        }
    }
}
