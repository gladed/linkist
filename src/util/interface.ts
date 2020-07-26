/** Return a type that includes only its public interface members of [Class]. */
type PublicInterfaceOf<Class> = {
    [Member in keyof Class]: Class[Member];
};
